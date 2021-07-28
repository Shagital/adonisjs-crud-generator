const Schema = use('Schema');
const Config = use(`Config`);
const User = use(Config.get('crudGenerator.admin_user', 'App/Models/AdminUser'));
const Role = use(`Role`);
const Hash = use(`Hash`);
const Permission = use(`Permission`);
/**
 * Class FillDefaultAdminUserAndPermissions
 */
class FillDefaultAdminUserAndPermissions extends Schema
{
  async up() {
    let roleName = Config.get('crudGenerator.admin_role', 'administrator');

    let user = {
      email: Config.get('crudGenerator.admin_email', 'administrator@webmail.com'),
      password: {{password}}
    }

    let requiredColumns = User.getColumns();

    for(let column of requiredColumns) {
      if(!user.hasOwnProperty(column)) {
        user[column] = '';
      }
    }

    let permissions = [
      // view admin as a whole
      'admin',

      // manage translations
      'admin.translation.index',
      'admin.translation.edit',
      'admin.translation.rescan',

      // manage users (access)
      'admin.admin-user.index',
      'admin.admin-user.create',
      'admin.admin-user.edit',
      'admin.admin-user.delete',

      // ability to upload
      'admin.upload',

      //ability to impersonal login
      'admin.admin-user.impersonal-login'
    ].map((s) => {
      return {
        name: s,
        slug: s
      }
    });


    let adminUser = await User.findOrCreate({email: user.email}, user);
    await User.query()
    .where('id', adminUser.id)
    .update({password: await Hash.make(user.password)});


    let permissionIds = [];
    for(let p of permissions) {
      let permission = await Permission.findOrCreate({name: p.name}, p);
      permissionIds.push(permission.id);
    }

    let role = await Role.findOrCreate({slug:roleName}, {name:roleName, slug:roleName});
    await role.permissions().attach(permissionIds);
    await adminUser.roles().attach([role.id])

  }

  down() {

  }
}
module.exports = FillDefaultAdminUserAndPermissions
