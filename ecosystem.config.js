module.exports = {
  apps: [{
    name: 'coverscore',
    script: './src/server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env'
  }]
};
