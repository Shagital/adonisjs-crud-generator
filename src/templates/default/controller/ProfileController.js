'use strict'
const {validateAll} = use('Validator');
const Hash = use('Hash');
const Config = use('Config');
const User = use(Config.get('crudGenerator.admin_user', 'App/Models/AdminUser'));

class ProfileController {

  async updateProfile({auth, response, request, session}) {
    let is_ajax = request.is_ajax;
    let user = await auth.getUser();

    const rules = {
      old_password: 'required_when:password|string|min:8',
      password: 'required_when:old_password|min:8|same:confirm_password|different:old_password',
      email: 'required|email',
    };

    let data = request.all();
    const validation = await validateAll(data, rules)

    let customErrors = [];

    if(data.old_password) {
    let verify = await Hash.verify(data.old_password, user.password);

    if(!verify) {
      customErrors.push({
          message:"Provided password is incorrect",
          field:"old_password",
          validation:"compare"
        }
      )
    }
  }

    if (validation.fails() || customErrors.length) {
      let errorMessages = (validation.messages() || []).concat(customErrors);

      if(is_ajax) {
        return response.status(422).send(errorMessages)
      }

      session
        .withErrors(errorMessages)
        .flashExcept(['password', 'old_password', 'confirm_password'])

      return response.redirect('back')
    }

    if(data.password) {
      user.password = data.password;
    }

    let prevEmail = user.email;

    await User.query()
    .where('email', user.email).update({
      password: user.password,
      email: data.email,
    });

    let msg = `Your password${data.email != prevEmail ? ' and email' : ''} has been updated successfully.`
    msg += ` You'll be required to login wuth new details next time`;

    session.put('alert-success', msg);

    is_ajax ? response.send({message:msg}) : response.redirect('back')

  }

  async show({auth, response, request, view}) {
    let is_ajax = request.is_ajax;
    let user = await auth.getUser();

    return is_ajax ? response.send({'data' : user}) : view.render('admin.profile.show', {'data' : user});
  }

  async login({auth, response, request, session, view}) {
    let is_ajax = request.is_ajax;
    const rules = {
      email: 'required',
      password: 'required|min:8',
    };

    const validation = await validateAll(request.all(), rules)

    if (validation.fails()) {
      if(is_ajax) {
        return response.status(422).send(validation.messages())
      }
      session
        .withErrors(validation.messages())
        .flashExcept(['password'])

      return response.redirect('back')
    }

    const data = request.only(['email', 'password']);

    let token = Config.get('auth.authenticator')  === 'jwt' ? await auth.withRefreshToken().attempt(data.email, data.password) : await auth.attempt(data.email, data.password);

    return is_ajax ? response.send({data:token}) : view.render('admin.profile.edit');

  }

  async refresh({ auth, response, request }) {
    let refreshToken = request.header('refresh-token') || request.input('_refresh_token');

    // refesh tokens and invalidate old tokens
    let result = await Promise.all([
       auth.newRefreshToken().generateForRefreshToken(refreshToken),
      auth.revokeTokens([refreshToken], true),
    ]);

    return response.send(result[0]);
  }

  async logout({auth, response, request, view}) {
    let is_ajax = request.is_ajax;
    const apiToken = auth.getAuthHeader();
    await auth
      .revokeTokens([apiToken]);
    return is_ajax ? response.status(204).send('') : view.render('admin.profile.login');
  }
}

module.exports = ProfileController
