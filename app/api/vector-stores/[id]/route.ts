import { NextRequest, NextResponse} from "next/server";
import * as path from "path";
import * as fs from "fs";
const STORES_DIR = path.join(process.cwd(), "chroma_data");
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storeDir = path.join(STORES_DIR, params.id);

    if (!fs.existsSync(storeDir)) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    // Delete the entire store directory
    fs.rmSync(storeDir, { recursive: true, force: true });

    return NextResponse.json({ success: true, data: { message: "Store deleted successfully" } });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete store" },
      { status: 500 }
    );
  }
}