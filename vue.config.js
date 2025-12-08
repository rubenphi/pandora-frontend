module.exports = {



  
  publicPath:  '/'
,
    configureWebpack: {
      resolve: {
        fallback: {
          "fs": false,
          "path": false,
          "crypto": false
        }
      },
      devServer: {
        allowedHosts: 'all',
        client: {
                webSocketURL: 'auto://0.0.0.0:0/ws'
             }, 
        headers: {
          'Access-Control-Allow-Origin': '*'            
        },

      }
    }
}
