export function parseModelJSON(text: string): any[] {
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
    throw new Error('模型未返回有效 JSON')
}

export async function isPDF(file: File): Promise<boolean> {
    // 只读取前 5 个字节
    const slice = file.slice(0, 5)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // %PDF- 的 ASCII 码
    const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D]

    return pdfMagic.every((byte, i) => bytes[i] === byte)
}