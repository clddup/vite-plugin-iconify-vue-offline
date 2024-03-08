# 介绍

vue-element-plus-admin 项目的icon采用线上图标, 打包后部署在纯内网环境无法渲染icon, 使用此插件可以在 build 时候将用到的icon动态打包到项目中

# 安装
```sh
npm install vite-plugin-iconify-vue-offline
```

# 使用

vite.config.ts
```ts
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
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
            Icon()
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
```ts
import 'vue/jsx'

// 引入windi css
import '@/plugins/unocss'

// 导入全局的svg图标
import '@/plugins/svgIcon'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入element-plus
import { setupElementPlus } from '@/plugins/elementPlus'

// 引入全局样式
import '@/styles/index.less'

// 引入动画
import '@/plugins/animate.css'

// 路由
import { setupRouter } from './router'

// 权限
import { setupPermission } from './directives'

import { createApp } from 'vue'

import App from './App.vue'

import './permission'

import 'virtual:icon'

// 创建实例
const setupAll = async () => {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)

  setupGlobCom(app)

  setupElementPlus(app)

  setupRouter(app)

  setupPermission(app)

  app.mount('#app')
}

setupAll()

```