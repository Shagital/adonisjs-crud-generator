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

    let columns = User.getColumns();
    let user = {};

    for (let col of columns) {
      switch (col) {
        case 'email':
          user[col] = Config.get('crudGenerator.admin_email', 'administrator@webmail.com');
          break;
        case 'password':
          user[col] = {{password}};
          break;
        case 'name':
        case 'username':
          user[col] = 'administrator';
          break;
        default:
          user[col] = "" // use empty string for required but not present columns
          break;
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
    // we need to do this incase it's an existing user. We need to change the password to the newly generated one
    adminUser.password = await Hash.make(user.password);
    await adminUser.save();

    let permissionIds = [];
    for(let p of permissions) {
      let permission = await Permission.findOrCreate({name: p.name}, p);
      permissionIds.push(permission.id);
    }

    let role = await Role.findOrCreate({ name: roleName, slug : roleName }, { name: roleName, slug: roleName });
    await role.permissions().attach(permissionIds);
    await adminUser.roles().attach([role.id])

  }

  down() {

  }
}
module.exports = FillDefaultAdminUserAndPermissions
