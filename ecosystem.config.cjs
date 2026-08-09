const DEPLOY_HOST = 'amster_app'
const DEPLOY_USER = 'appuser'
const DEPLOY_PATH = '/home/appuser/apps/cosmic-clock'
const APP_PORT = 3060

module.exports = {
  apps: [
    {
      name: 'cosmic-clock',
      cwd: `${DEPLOY_PATH}/source`,
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_file: `/home/${DEPLOY_USER}/logs/cosmic-clock-combined.log`,
      out_file: `/home/${DEPLOY_USER}/logs/cosmic-clock-out.log`,
      error_file: `/home/${DEPLOY_USER}/logs/cosmic-clock-error.log`,
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: APP_PORT,
      },
    },
  ],

  deploy: {
    production: {
      user: DEPLOY_USER,
      host: DEPLOY_HOST,
      ref: 'origin/main',
      // TODO: replace after creating GitHub repo
      repo: 'git@github.com:RaufERK/cosmic-clock.git',
      path: DEPLOY_PATH,
      'pre-deploy-local': '',
      'post-deploy': [
        'export NODE_ENV=production',
        'source ~/.nvm/nvm.sh && nvm use 24',
        `ln -sfn ${DEPLOY_PATH}/shared/.env ./.env`,
        'npm ci --include=dev',
        'npm run build',
        'pm2 startOrReload ecosystem.config.cjs --env production',
        'pm2 save',
      ].join(' && '),
      env: {
        NODE_ENV: 'production',
      },
    },
  },
}
