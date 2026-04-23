import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import path from "path";
import fs from 'fs';
import { generateExcel } from "./generate-excel";
const PROMPT_CONTENT = fs.readFileSync(path.resolve(process.cwd(), 'app', 'api', 'files', 'prompt.md'))?.toString?.(); //prompt内容
const apiKey = 'sk-1fae8b198b114399b097b74f0114586e';
const openai = new OpenAI({
    apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})
function parseModelJSON(text: string): any[] {
    const attempts = [
        () => JSON.parse(text.trim()),
        () => JSON.parse(text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()),
        () => {
            const match = text.match(/\[[\s\S]*\]/)
            if (!match) throw new Error('no match')
            return JSON.parse(match[0])
        },
    ]

    for (const attempt of attempts) {
        try {
            const result = attempt()
            if (Array.isArray(result)) return result
        } catch { }
    }

    console.error('JSON 解析失败，原始内容：', text)
    throw new Error('模型未返回有效 JSON')
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
    const file = formData.get('file') as File;
    let errorMessage = '';
    let excelBuffer;
    try {
        if (!file || !(file instanceof File)) {
            throw Error('用户没有上传文件')
        }
        if (!isPDF(file)) {
            throw Error(`${file?.name} 不是pdf文件`)
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const openAIFile = await toFile(buffer, file.name, { type: file.type })
        const uploadedFile = await openai.files.create({
            file: openAIFile,
            purpose: 'file-extract',
        })
        const messages = [
            {
                role: 'system',
                content: `fileid://${uploadedFile?.id}`
            },
            {
                role: 'user',
                content: PROMPT_CONTENT,
            }
        ]
        console.log('messages is ', messages)
        const modelResponse = await openai.chat.completions.create({
            model: 'qwen-long-latest',
            messages,
        })
        const text = modelResponse.choices[0].message.content ?? '';
        console.log({
            messages,
            text,
        })
        const json = parseModelJSON(text)
        excelBuffer = await generateExcel(json);
        console.log({
            json,
            excelBuffer
        })
        console.log('token使用量:', modelResponse.usage)
        console.log('finish_reason:', modelResponse.choices[0].finish_reason)
        console.log('completion_tokens:', modelResponse.usage?.completion_tokens)
    }
    catch (exception) {
        errorMessage = (exception as Error).message ?? exception
    }
    const response = errorMessage ? NextResponse.json({
        message: `分析失败，原因:${errorMessage}`,
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