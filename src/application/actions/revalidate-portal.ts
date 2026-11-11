import { revalidatePath } from "next/cache";

export function revalidatePortalCache(extraPaths: string[] = []): void {
  revalidatePath("/", "layout");
  revalidatePath("/", "page");
  revalidatePath("/admin", "page");
  revalidatePath("/busca", "page");
  revalidatePath("/sitemap.xml");
  for (const path of extraPaths) {
    revalidatePath(path);
  }
}

