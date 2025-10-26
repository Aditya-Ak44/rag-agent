import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const STORES_DIR = path.join(process.cwd(), "chroma_data");

interface VectorStore {
  id: string;
  name: string;
  embeddingModel: string;
  fileCount: number;
  chunkCount: number;
  createdAt: string;
  status: "ready" | "processing";
}

export async function GET() {
  try {
    if (!fs.existsSync(STORES_DIR)) {
      fs.mkdirSync(STORES_DIR, { recursive: true });
      return NextResponse.json({ success: true, data: [] });
    }

    const stores: VectorStore[] = [];
    const dirs = fs.readdirSync(STORES_DIR);

    for (const dir of dirs) {
      const metaPath = path.join(STORES_DIR, dir, "meta.json");
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        stores.push(meta);
      }
    }

    // Sort by creation date (newest first)
    stores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}