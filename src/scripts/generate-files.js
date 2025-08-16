import { glob } from "glob";
import path from "path";
import fs from "fs";

const dir = path.join(process.cwd(), "public/f");
const files = glob.sync("*", {
  cwd: dir,
  nodir: true,
  ignore: ["**/*.json", "p/*"],
});

const output = path.join(dir, "files.json");

fs.writeFileSync(output, JSON.stringify(files, null, 2));

console.log("Generated files:", files.join(", "));
