module.exports = {
  
  publicPath: process.env.NODE_ENV === 'production'
    ? '/E-Reader/'
    : '/'
,
    configureWebpack: {        
      devServer: {
        headers: {
          'Access-Control-Allow-Origin': '*'            
        }
      }
    }
}
