# AdonisJS CRUD Generator
![npm](https://img.shields.io/npm/dt/@shagital/adonisjs-crud-generator?style=plastic)
![npm (scoped)](https://img.shields.io/npm/v/@shagital/adonisjs-crud-generator)
![NPM](https://img.shields.io/npm/l/@shagital/adonisjs-crud-generator)

Version [for **Adonis v5**]

This package allows you easily generate admin dashboard for your existing [AdonisJS](https://adonisjs.com/) app. The package generates the following:
- Migrations
- Controllers
- Model
- Routes
- Views

## Currently Supported
- MySQL
- PostgreSQL
- SQLite

## Requirements
- Adonisjs v5
- Node >=8 (v14 recommended)
- Mysql >=5
- PostgreSQL >=10

## Dependencies
- [Adonis ACL](https://github.com/shagital/adonisjs-acl) for role and permission management

## Installation

You can install the package via NPM:
``` bash
npm install @shagital/adonisjs-crud-generator
```
Or with yarn
``` bash
yarn add @shagital/adonisjs-crud-generator
```

## Setup
- Configure the package using `node ace configure @shagital/adonisjs-crud-generator`. This should update your `.adonisrc.json` file.
- Ensure your app is completely setup with `@adonisjs/auth` and `@adonisjs/lucid`
- If you choose to use redis to save tokens, you have to install `@adonisjs/redis'
- Depending on which hashing algorithm you choose in `config/hash.ts`, you'll have to install the corresponding dependency e.g `phc-bcrypt` for bcrypt.
- The `api` authentication method has to be functional becuase this package uses `auth:api`. If you want to save tokens in redis, you have to install `@adonisjs/redis`
- Run `node ace crud:init --prefix=admin` to generate default files for admin panel. Where `prefix` is the base path for admin routes to be generated
- Default admin password will be shown to you when the command is done. Copy it somewhere for login. In case you forget or need to change it, you can open `database/migrations/admin_default_role_permission.ts` to see the password. You can also change password after login
- Update `config/crudGenerator.ts` to customise settings

##
- The default admin email is `administrator@webmail.com`. You can change the email before running migration
- Run migration `node ace migration:run` to create admin user and set up roles and permissions
- Change to the admin app directory `cd resources/views/admin`
- Run `npm install` or `yarn install` to install dependencies
- At this point, your admin dashboard should be ready to use
- Start the API server: `node ace serve` or `yarn dev`
- Start the frontend app: `npm run serve` or `yarn serve`
- You should be able to change your password after successful login
- If you encouter CORS error, open `config/cors.ts` and configure the cors settings correctly.

## Usage
To generate CRUD management for table `regions`, run `node ace crud:generate regions` and the following will be created
- Controller `app/Controllers/Http/Admin/RegionsController.ts`
- `start/routes.ts` file will be updated with new routes
- Mode `App/Models/Region.ts` model will be created with appropriate relationships hooks
- A migration file will be generated to add new permissions for the admin
- Vue files will be generated and the sidebar will be updated with new links

Navigate to your app and you should see the `Region` menu on the sidebar

## Available Commands
- `node ace crud:controller tableName`: This creates controller file and route
- `node ace crud:model tableName`: This creates model file node ace relationships
- `node ace crud:permission tableName`: This creates migration file for crud permissions
- `node ace crud:view tableName`: This creates vue files
- `node ace crud:init tableName`: This runs all of the above commands

## Options
- `--connection`: This option allows you specify which DB connection to use for the command e.g
`node ace crud:controller tableName --connection=sqlite`
>NB: The connection must have been defined in `config/database.ts`

- `--migrate`: This option is available for the `crud:generate` and `crud:permission` commands. It tells the system to automatically run the newly created migration files.
- `--prefix`: This option is available when initialising the CRUD with `crud:init`. It allows you specify a prefix for the admin endpoints that'll be created. If not specified, the system generates a random prefix

## Production
Run `npm run build` or `yarn build`
- Your view app should be available on `http://<BASE_URL>/<prefix>`

## Error
If an error occurs while executing any of the command, it'll crash. Simply check your log to find out what went wrong - likely a file/directory permission issue, then run the command again.
>Note: Except otherwise stated, the commands always overwrite existing files (with same name)

## Screenshots
![Login](screenshots/1.png)

![Dashboard](screenshots/2.png)

![Profile](screenshots/3.png)

![List](screenshots/4.png)

![Form](screenshots/5.png)

## Todo
- Add tests

## Contributing
If you have a feature you'd like to add, kindly send a Pull Request (PR)

## Security
If you discover any security related issues, please email [zacchaeus@shagital.com](mailto:zacchaeus@shagital.com) instead of using the issue tracker.

## Credits
- [Zacchaeus Bolaji](https://github.com/djunehor)
- [All Contributors](../../contributors)

## License
The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
