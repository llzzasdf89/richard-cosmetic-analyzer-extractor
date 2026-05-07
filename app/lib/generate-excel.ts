import ExcelJS from 'exceljs'

// ─── 类型定义 ────────────────────────────────────────────────────

interface SubCategory {
    name: string         // 小类名称，如"磷脂类乳化剂"
    components: string[] // 具体物质名称列表，如["大豆卵磷脂", "羟基化卵磷脂"]
}

interface Category {
    name: string             // 大类名称，如"乳化剂"
    ratio?: string | null    // 大类比例范围，如"1-20%"
    subCategories: SubCategory[]
}

interface Example {
    name: string                        // 如"实施例1"、"对比例1"
    components: Record<string, string>  // 具体物质名 -> 用量，如{"大豆卵磷脂": "5%"}
    testResults: Record<string, boolean>
}

interface SheetData {
    sheetName: string
    categories: Category[]
    examples: Example[]
    testItems: string[]
}

type ModelJSON = SheetData[]

// ─── 展平组份 ────────────────────────────────────────────────────

interface FlatComponent {
    categoryName: string
    subCategoryName: string
    componentName: string
}

function flattenComponents(categories: Category[]): FlatComponent[] {
    const result: FlatComponent[] = []
    for (const cat of categories) {
        for (const sub of cat.subCategories) {
            for (const comp of sub.components) {
                result.push({
                    categoryName: cat.name,
                    subCategoryName: sub.name,
                    componentName: comp,
                })
            }
        }
    }
    return result
}

// ─── 样式 ────────────────────────────────────────────────────────

const COLORS = {
    categoryHeader: 'FFD6E4BC',
    subCategoryHeader: 'FFE2EFDA',
    componentHeader: 'FFF2F7ED',
    exampleName: 'FFDAE8FC',
    testHeader: 'FFFCE4D6',
    checkColor: 'FF00B050',
    border: 'FFB0B0B0',
}

function applyBorder(cell: ExcelJS.Cell) {
    const s = { style: 'thin' as const, color: { argb: COLORS.border } }
    cell.border = { top: s, left: s, bottom: s, right: s }
}

function headerCell(cell: ExcelJS.Cell, value: string, bg: string, center = false) {
    cell.value = value
    cell.font = { name: 'Arial', bold: true, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    cell.alignment = { horizontal: center ? 'center' : 'left', vertical: 'middle', wrapText: true }
    applyBorder(cell)
}

function dataCell(cell: ExcelJS.Cell, value: string) {
    cell.value = value
    cell.font = { name: 'Arial', size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    applyBorder(cell)
}

// ─── 构建子表 ────────────────────────────────────────────────────
//
// 表头 3 行：
//   行1：[实施例/对比例 跨3行] [大类A 跨N列] [大类B...] [测试项目 跨K列]
//   行2：                      [小类A1 跨x列] [小类A2...] [测试1跨2行] [测试2...]
//   行3：                      [物质1] [物质2] ...
//   行4+：数据行

function buildSheet(ws: ExcelJS.Worksheet, data: SheetData) {
    const flat = flattenComponents(data.categories)

    const HEADER_ROWS = 3
    const COL_EXAMPLE = 1
    const COL_COMP_START = 2
    const COL_TEST_START = COL_COMP_START + flat.length

    // ── 行1：大类 ──────────────────────────────────────────────────
    headerCell(ws.getCell(1, COL_EXAMPLE), '实施例 / 对比例', COLORS.exampleName, true)
    ws.mergeCells(1, COL_EXAMPLE, HEADER_ROWS, COL_EXAMPLE)

    let cursor = COL_COMP_START
    for (const cat of data.categories) {
        const span = cat.subCategories.reduce((s, sub) => s + sub.components.length, 0)
        if (span === 0) continue
        const label = cat.ratio ? `${cat.name}\n(${cat.ratio})` : cat.name
        headerCell(ws.getCell(1, cursor), label, COLORS.categoryHeader, true)
        if (span > 1) ws.mergeCells(1, cursor, 1, cursor + span - 1)
        cursor += span
    }

    if (data.testItems.length > 0) {
        headerCell(ws.getCell(1, COL_TEST_START), '测试项目', COLORS.testHeader, true)
        if (data.testItems.length > 1) {
            ws.mergeCells(1, COL_TEST_START, 1, COL_TEST_START + data.testItems.length - 1)
        }
    }

    // ── 行2：小类 ──────────────────────────────────────────────────
    cursor = COL_COMP_START
    for (const cat of data.categories) {
        for (const sub of cat.subCategories) {
            const span = sub.components.length
            if (span === 0) continue
            headerCell(ws.getCell(2, cursor), sub.name, COLORS.subCategoryHeader, true)
            if (span > 1) ws.mergeCells(2, cursor, 2, cursor + span - 1)
            cursor += span
        }
    }

    // 测试项目在行2-3合并
    for (let i = 0; i < data.testItems.length; i++) {
        headerCell(ws.getCell(2, COL_TEST_START + i), data.testItems[i], COLORS.testHeader, true)
        ws.mergeCells(2, COL_TEST_START + i, 3, COL_TEST_START + i)
    }

    // ── 行3：具体物质名 ────────────────────────────────────────────
    for (let i = 0; i < flat.length; i++) {
        headerCell(ws.getCell(3, COL_COMP_START + i), flat[i].componentName, COLORS.componentHeader, true)
    }

    // ── 行4+：实施例数据 ───────────────────────────────────────────
    for (let ei = 0; ei < data.examples.length; ei++) {
        const ex = data.examples[ei]
        const row = HEADER_ROWS + 1 + ei

        const nc = ws.getCell(row, COL_EXAMPLE)
        nc.value = ex.name
        nc.font = { name: 'Arial', bold: true, size: 10 }
        nc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.exampleName } }
        nc.alignment = { horizontal: 'center', vertical: 'middle' }
        applyBorder(nc)

        // 用具体物质名匹配用量
        for (let ci = 0; ci < flat.length; ci++) {
            dataCell(ws.getCell(row, COL_COMP_START + ci), ex.components[flat[ci].componentName] ?? '')
        }

        // 测试项目勾选
        for (let ti = 0; ti < data.testItems.length; ti++) {
            const cell = ws.getCell(row, COL_TEST_START + ti)
            const checked = ex.testResults[data.testItems[ti]] === true
            if (checked) {
                cell.value = '✓'
                cell.font = { name: 'Arial', bold: true, size: 12, color: { argb: COLORS.checkColor } }
            } else {
                cell.value = ''
                cell.font = { name: 'Arial', size: 10 }
            }
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            applyBorder(cell)
        }
    }

    // ── 列宽行高冻结 ────────────────────────────────────────────────
    ws.getColumn(COL_EXAMPLE).width = 16
    for (let i = 0; i < flat.length; i++) ws.getColumn(COL_COMP_START + i).width = 14
    for (let i = 0; i < data.testItems.length; i++) ws.getColumn(COL_TEST_START + i).width = 12

    ws.getRow(1).height = 40
    ws.getRow(2).height = 32
    ws.getRow(3).height = 28
    for (let ei = 0; ei < data.examples.length; ei++) {
        ws.getRow(HEADER_ROWS + 1 + ei).height = 22
    }

    ws.views = [{ state: 'frozen', xSplit: 1, ySplit: HEADER_ROWS }]
}

// ─── 主函数 ──────────────────────────────────────────────────────

export async function generateExcel(modelJson: ModelJSON): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Patent Analyzer'
    workbook.created = new Date()

    for (const sheetData of modelJson) {
        const ws = workbook.addWorksheet(sheetData.sheetName, {
            pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
        })
        buildSheet(ws, sheetData)
    }

    return Buffer.from(await workbook.xlsx.writeBuffer())
}