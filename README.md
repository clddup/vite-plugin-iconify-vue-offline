# 介绍

vue-element-plus-admin 项目的icon采用线上图标, 打包后部署在纯内网环境无法渲染icon, 使用此插件可以在 build 时候将用到的icon动态打包到项目中

0.0.5 版本适配了 vben v2版本

# 安装
```sh
npm install vite-plugin-iconify-vue-offline
```

# 使用

vite.config.ts

在 vite.config.ts 中引入并配置到plugins
```ts
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
// 引入vite-plugin-iconify-vue-offline插件
import Icon from 'vite-plugin-iconify-vue-offline'

export default ({ command, mode }: ConfigEnv): UserConfig => {
    let env = {} as any
    const isBuild = command === 'build'
    if (!isBuild) {
        env = loadEnv(process.argv[3] === '--mode' ? process.argv[4] : process.argv[3], root)
    } else {
        env = loadEnv(mode, root)
    }
    return {
        base: env.VITE_BASE_PATH,
        plugins: [
            // 在这里配置vite-plugin-iconify-vue-offline插件
            Icon(),
            Vue({
                script: {
                // 开启defineModel
                defineModel: true
                }
            }),
            VueJsx()
            ......
        ]
        
        ......
    }
})
```

main.ts

在 main.ts 中引入 virtual:icon
```ts
...

// 引入 virtual:icon
import 'virtual:icon'

...

```

最后在build阶段就会将用到的 icon 打包进去
