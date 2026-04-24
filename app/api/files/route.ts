import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import path from "path";
import fs from 'fs';
import { generateExcel } from "./generate-excel";
import { parseModelJSON, isPDF } from "@/app/lib/utils";
import { createHandler } from "@/app/lib/api";
import { rootLogger } from "@/app/lib/logger";
import type { ChatCompletionMessageParam, FilePurpose } from "openai/resources";
const PROMPT_CONTENT = fs.readFileSync(path.resolve(process.cwd(), 'public', 'prompt.md'))?.toString?.(); //prompt内容
const apiKey = 'sk-1fae8b198b114399b097b74f0114586e';
const openai = new OpenAI({
    apiKey,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})
export const { POST } = createHandler({
    async POST(request: Request) {
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
                purpose: 'file-extract' as FilePurpose,
            })
            const messages: ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: `fileid://${uploadedFile?.id}`
                },
                {
                    role: 'user',
                    content: PROMPT_CONTENT,
                }
            ]
            rootLogger.info(`[${new Date().toISOString()}][start] model questioning... with` + JSON.stringify(messages))
            const modelResponse = await openai.chat.completions.create({
                model: 'qwen-long-latest',
                messages,
            })
            const text = modelResponse.choices[0].message.content ?? '';
            rootLogger.info(`[${new Date().toISOString()}][end] model answered with ${text}`)
            const json = parseModelJSON(text)
            excelBuffer = await generateExcel(json);
            rootLogger.info(`[${new Date().toISOString()}][token usage] ${JSON.stringify(modelResponse?.usage ?? '')}`)
            rootLogger.info(`[${new Date().toISOString()}][model finish reason] ${JSON.stringify(modelResponse?.choices?.[0].finish_reason ?? '')}`)
            rootLogger.info(`[${new Date().toISOString()}][completion_tokens ] ${JSON.stringify(modelResponse.usage?.completion_tokens ?? '')}`)
        }
        catch (exception) {
            errorMessage = (exception as Error).message ?? JSON.stringify(errorMessage ?? '')
            rootLogger.error(` [${new Date().toISOString()}] [system error] with ${errorMessage}`)
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
        }) : new NextResponse(new Uint8Array(excelBuffer!), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="output.xlsx"',
            }
        })
        return response;
    }
})