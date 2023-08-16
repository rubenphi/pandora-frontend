module.exports = {



  
  publicPath:  '/'
,
    configureWebpack: {         
      devServer: {
        allowedHosts: 'all',
        client: {
                webSocketURL: 'auto://0.0.0.0:0/ws'
             },
        headers: {
          'Access-Control-Allow-Origin': '*'            
        },
        proxy: 'auto://localhost:3000',
      }
    }
}
