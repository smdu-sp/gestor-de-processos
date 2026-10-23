import type { NextConfig } from "next";
const config: NextConfig = {
  // O volume Windows deste workspace não oferece junctions/readlink convencionais.
  webpack(config) {
    config.resolve.symlinks = false;
    config.resolveLoader.symlinks = false;
    return config;
  },
};
export default config;
