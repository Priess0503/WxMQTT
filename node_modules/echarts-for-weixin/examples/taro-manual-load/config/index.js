const config = {
  projectName: 'taro-sample-weapp',
  date: '2018-9-10',
  designWidth: 750,
  deviceRatio: {
    '640': 2.34 / 2,
    '750': 1,
    '828': 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  defineConstants: {
  },
  copy: {
    patterns: [
      { from: 'project.package.json', to: 'dist/package.json' }, // 指定需要 copy 的文件
      { from: 'node_modules/echarts-for-weixin/', to: 'dist/node_modules/echarts-for-weixin/' }
    ],
    options: {}
  },
  weapp: {
    compile: {
      exclude: []
    },
    module: {
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    module: {
      postcss: {

      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
