import path from 'node:path'
import fs from 'node:fs'
import fg from 'fast-glob'
import { walk, parse, babelParse } from '@vue/compiler-sfc'
import * as vf from '@iconify/utils'
import { dir } from '@iconify/json'

const iconJSON = Object.fromEntries(
  fg
    .sync('*.json', {
      cwd: path.resolve(dir, 'json'),
    })
    .map((item) => {
      return [
        path.basename(item),
        {
          path: item,
          json: undefined
        }
      ]
    })
)


export default function icon() {
  const virtualModuleId = 'virtual:icon'
  const resolvedVirtualModuleId = '\0' + virtualModuleId
  const iconifyVueId = '@iconify/vue'
  const resolvedIconifyVueId = '\0' + iconifyVueId
  const fileCache = new Map()
  let isBuild = false
  return {
    name: 'vite-plugin-iconify-vue-offline',
    enforce: 'pre',
    apply(config, { command }) {
      // 非 SSR 情况下的 build
      isBuild = command === 'build' && !config.build.ssr
      return true
    },
    config: (config) => {
      return {
        ...config,
        define: isBuild
          ? {
              ...(config.define && {}),
              'import.meta.env.VITE_USE_ONLINE_ICON': JSON.stringify('true')
            }
          : config.define
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      if (isBuild && id === iconifyVueId) {
        return resolvedIconifyVueId
      }
    },
    load(id) {
      if (isBuild && id === resolvedIconifyVueId) {
        return 'export * from "@iconify/vue/offline"'
      }
      if (isBuild && id === resolvedVirtualModuleId) {
        let files = fg.sync('**/*.{js,jsx,ts,tsx,vue}', {
          cwd: 'src',
          stats: true,
          absolute: true
        })
        files.forEach((item) => {
          if (!fileCache.get(item.path)) {
            fileCache.set(item.path, {
              icon: new Set(),
              mtimeMs: 0
            })
          }

          let vF = fileCache.get(item.path)
          if (item.stats.mtimeMs != vF.mtimeMs) {
            fileCache.set(item.path, {
              icon: vF.icon,
              mtimeMs: item.stats.mtimeMs
            })
            const extname = path.extname(item.name).toLowerCase()
            const fCode = fs.readFileSync(item.path, 'utf-8')
            let jAst, tAst
            switch (extname) {
              case '.js':
                jAst = babelParse(fCode, {
                  sourceType: 'module'
                })
                break
              case '.jsx':
                jAst = babelParse(fCode, {
                  sourceType: 'module',
                  plugins: ['jsx']
                })
                break
              case '.ts':
                jAst = babelParse(fCode, {
                  sourceType: 'module',
                  plugins: ['typescript']
                })
                break
              case '.tsx':
                jAst = babelParse(fCode, {
                  sourceType: 'module',
                  plugins: ['typescript', 'jsx']
                })
                break

              case '.vue':
                const { descriptor } = parse(fCode)
                
                if (descriptor?.template?.ast) {
                  tAst = descriptor.template.ast
                }
                if (descriptor?.scriptSetup?.content) {
                  jAst = babelParse(descriptor?.scriptSetup?.content, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx']
                  })
                } else if (descriptor?.script?.content) {
                  jAst = babelParse(descriptor?.script?.content, {
                    sourceType: 'module',
                    plugins: ['typescript', 'jsx']
                  })
                }
                break
              default:
                break
            }

            tAst &&
              walk(tAst, {
                enter(node) {
                  switchAstType(node, node.type, fileCache.get(item.path).icon)
                }
              })

            jAst &&
              walk(jAst, {
                enter(node) {
                  if (node.type === 'StringLiteral') {
                    setJAstIcon(node.value, fileCache.get(item.path).icon)
                  }
                }
              })
          }
        })

        let iconObj = getIconObj(Array.from(fileCache.values()))

        for (let i in iconObj) {
          if (iconJSON[`${i}.json`]) {
            if (!iconJSON[`${i}.json`].json) {
              iconJSON[`${i}.json`].json = JSON.parse(fs.readFileSync(iconJSON[`${i}.json`].path))
            }
            iconJSON[`${i}.json`].useJSON = vf.getIcons(iconJSON[`${i}.json`].json, iconObj[i])
          }
        }

        const code = `
          import { addCollection } from '@iconify/iconify'
          let iconList = ${JSON.stringify(
            Object.values(iconJSON)
              .map((item) => item.useJSON)
              .filter((item) => item)
          )}
          iconList.forEach(item => addCollection(item))
        `
        return code
      } else if (!isBuild && id === resolvedVirtualModuleId) {
        return ''
      }
    }
  }
}

function setJAstIcon(str, set) {
  const iconArr = Object.keys(iconJSON).map((item) => {
    return item.split('.')[0]
  })
  if (iconArr.includes(str.split(':')[0])) {
    set.add(str)
  }
}


function getIconObj(list) {
  let iconObj = [
    ...new Set(
      list.reduce((prev, next) => {
        return new Set([...prev, ...next.icon])
      }, new Set())
    )
  ].reduce((prev, next) => {
    let [category, name] = next.split(':')
    if (!prev[category]) prev[category] = []
    if (!prev[category].includes(next)) prev[category].push(name)
    return prev
  }, {})
  return iconObj
}

function switchAstType(node, type, set){
  switch (type) {
    case 1:
      if (node?.props?.length > 0) {
        node.props
          .forEach((item) => {
            switchAstType(item, item?.type, set)
          })
      }
      break;
    case 6:
      setJAstIcon(node?.value?.content || '', set)
      break;
    case 5:
      node?.content?.ast &&  walk(node?.content?.ast, {
        enter(node) {
          if (node.type === 'StringLiteral') {
            setJAstIcon(node.value, set)
          }
        }
      })
      break;
    case 7:
      node?.exp?.ast &&  walk(node?.exp?.ast, {
        enter(node) {
          if (node.type === 'StringLiteral') {
            setJAstIcon(node.value, set)
          }
        }
      })
      break;
    default:
      break;
  }
  if (node?.children?.length > 0) {
    node.children.forEach((item) => {
      switchAstType(item, item.type, set)
    })
  }
}
