import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Allow importing the shared CLI modules from ../src/
    config.resolve.alias['@sfstlr/data'] = path.resolve(__dirname, '../src/data.js');
    config.resolve.alias['@sfstlr/resolver'] = path.resolve(__dirname, '../src/resolver.js');
    config.resolve.alias['@sfstlr/blacklist'] = path.resolve(__dirname, '../src/blacklist.js');
    return config;
  },
};

export default nextConfig;
