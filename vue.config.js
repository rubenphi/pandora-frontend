module.exports = {



  
  publicPath:  '/'
,
    configureWebpack: {        
      devServer: {
        allowedHosts: 'all',
        headers: {
          'Access-Control-Allow-Origin': '*'            
        }
      }
    }
}
