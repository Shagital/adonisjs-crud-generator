const Schema = use('Schema');
const Config = use(`Config`);
const User = use(Config.get('crugGenerator.admin_user', 'App/Models/User'));
const Role = use(`Role`);
const Permission = use(`Permission`);

/**
 * Class FillDefaultAdminUserAndPermissionsFor{{pascalCase}}
 */
class FillDefaultAdminUserAndPermissionsFor{{pascalCase}} extends Schema
{
  async up() {
    let permissions = [
      // view {{pascalCase}} as a whole
      '{{model}}',

      // manage {{pascalCase}} (access)
      'admin.{{model}}.index',
      'admin.{{model}}.create',
      'admin.{{model}}.edit',
      'admin.{{model}}.delete',

    ].map((s) => {
      return {
        name: s,
        slug: s
      }
    });


    let admin = await User.query()
      .where('email', Config.get('crudGenerator.admin_email', 'admininstrator@webmail.com'))
      .firstOrFail();

  let permissionIds = [];
  for(let p of permissions) {
    let permission = await Permission.findOrCreate({name: p.name}, p);
    permissionIds.push(permission.id);
  }

    let role = await Role.query()
    .where('name', Config.get('crudGenerator.admin_role', 'admininstrator'))
    .firstOrFail();
    await role.permissions().attach(permissionIds)
    await admin.roles().attach([role.id])

  }

  down() {

  }
}
module.exports = FillDefaultAdminUserAndPermissionsFor{{pascalCase}}
