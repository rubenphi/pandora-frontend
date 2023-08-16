module.exports = {



  
  publicPath:  '/'
,
    configureWebpack: {        
      devServer: {
        allowedHosts: 'all',
        headers: {
          'Access-Control-Allow-Origin': '*'            
        },
        proxy: 'https://pandora-nest.onrender.com',
      }
    }
}
