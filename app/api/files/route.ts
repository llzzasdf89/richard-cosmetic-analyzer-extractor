import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import path from "path";
import ExcelJS from 'exceljs';
const apiKey = 'sk-1fae8b198b114399b097b74f0114586e';
const templateBuffer = readFileSync(path.join(process.cwd(), 'uploads', '专利拆解.xls'));
const openai = new OpenAI({
    apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})
const templateToFile = await toFile(templateBuffer, '专利拆解', { type: 'application/vnd.ms-excel' })
const uploadedTemplateFile = await openai.files.create({
    file: templateToFile,
    purpose: 'file-extract',
})

async function generateExcel(rows: Record<string, any>[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Sheet1')

    if (rows.length === 0) return Buffer.alloc(0)

    // 自动从第一行数据生成列头
    const columns = Object.keys(rows[0])
    sheet.columns = columns.map(key => ({
        header: key,
        key,
        width: 20,
    }))

    // 写入数据
    rows.forEach(row => sheet.addRow(row))

    // 输出为 Buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}

async function isPDF(file: File): Promise<boolean> {
    // 只读取前 5 个字节
    const slice = file.slice(0, 5)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // %PDF- 的 ASCII 码
    const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D]

    return pdfMagic.every((byte, i) => bytes[i] === byte)
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const files = formData.getAll('files') as Array<File>;
    let err;
    let excelBuffer;
    if (!files.length) {
        return NextResponse.json({
            message: '没有上传文件',
            code: 500,
        }, {
            status: 500,
            statusText: 'error',
        })
    }
    if (!uploadedTemplateFile) {
        return NextResponse.json({
            message: '专利分析模板上传失败',
            code: 500,
        }, {
            status: 500,
            statusText: 'error',
        })
    }
    const uploadedFiles = [uploadedTemplateFile];
    //遍历前端所穿过来的所有PDF文件，校验并上传给openAI云空间
    for (const file of files) {
        try {
            if (!isPDF(file)) {
                throw Error(`${file.name} 不是pdf文件`)
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const openAIFile = await toFile(buffer, file.name, { type: file.type })
            const uploadedFile = await openai.files.create({
                file: openAIFile,
                purpose: 'file-extract',
            })
            uploadedFiles.push(uploadedFile);
        } catch (exception) {
            console.log('exception is ', exception)
            err = exception;
            break;
        }
    }

    if (uploadedFiles.length - 1 !== files.length) {
        err = '上传文件给openAI失败';
    }
    try {
        const messages = [
            ...uploadedFiles.map(item => ({
                role: 'system',
                content: `fileid://${item.id}`
            })),
            {
                role: 'user',
                content: `站在一个化妆品研发工程师的角度，完成以下工作:
                1.根据我上传的PDF专利文件, 输出一个excel文件（.xlsx)格式
                2.从专利摘要部分获取组合物几个大的组成部分：例如活性成分、乳化剂、助乳化剂、多元醇、液体脂质、磷脂、水等大类及其比例或者份数、质量百分比范围。
                3、从具体实施方式或者权利要求书部分获取所述组分大类分别是什么组份，并分别列出组份
                4、从具体实施方式列出各个实施例、对比例用到的组份和量（比例、百分比、份数），放在一起做成一个表格。横向表头为各个组份，竖向表头为各个实施例、对比例。组份上面是所属的大的组成部分。
                5、从试验例、测试例、实验例中找出测试的项目类别，比如什么的含量、稳定性、粒径、PDI、斑贴测试、刺激性、皮肤含水量等，在步骤3做出的表格右侧横向表头列出对应的测试项目，在对应实施例、或者对比例测试过的项目表格里打勾。
                
                `
            }, {
                role: 'user',
                content: `请将这份文档中的所有结构化数据提取为 JSON 数组。
                        要求：
                        - 字段名直接使用文档中的原始列名/标题
                        - 有多少列提取多少列，不要遗漏
                        - 每一条记录作为数组中的一个对象
                        - 只返回 JSON 数组，不要其他任何文字`
            }
        ]
        const modelResponse = await openai.chat.completions.create({
            model: 'qwen-long',
            messages,
        })
        const text = modelResponse.choices[0].message.content ?? '';
        const json = text.replace(/```json|```/g, '').trim();
        const rows = JSON.parse(json);
        excelBuffer = await generateExcel(rows);
    }
    catch (exception) {
        err = exception;
        console.log('err is ', err)
    }

    const response = err ? NextResponse.json({
        message: `分析失败，原因:${err}`,
        code: 500,
    }, {
        status: 500,
        statusText: 'err',
        headers: {
            'Content-Type': 'application/json',
        }
    }) : new NextResponse(excelBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="output.xlsx"',
        }
    })
    return response;
}