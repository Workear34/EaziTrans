import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 读取 git 信息；仓库不可用（无 .git、浅克隆无 tag）时返回空串，不影响构建
function git(args) {
  try {
    return execSync(`git ${args}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return '';
  }
}

// 版本号以 tag 为准：v0.4.0-4-g43e0cc1 → 版本 v0.4.0，距该 tag 4 个提交
const described = git('describe --tags --long --match "v*"').match(/^(v.+)-(\d+)-g([0-9a-f]+)$/);

export default defineConfig({
  base: process.env.DEPLOY_BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(described ? described[1] : `v${pkg.version}`),
    __GIT_COUNT__: JSON.stringify(described ? described[2] : ''),
    __GIT_COMMIT__: JSON.stringify(git('rev-parse --short=7 HEAD')),
    __GIT_DATE__: JSON.stringify(git('log -1 --format=%cs')),
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        settings: fileURLToPath(new URL('./settings.html', import.meta.url)),
      },
    },
  },
});
