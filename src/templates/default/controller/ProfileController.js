'use strict'
const {validateAll} = use('Validator');
const Hash = use('Hash');

class ProfileController {

  async updatePassword({auth, response, request, session}) {
    let is_ajax = request.is_ajax;
    let user = await auth.getUser();

    const rules = {
      old_password: 'required|min:8',
      password: 'required|min:8|same:confirm_password',
    };

    const validation = await validateAll(request.all(), rules)

    let customErrors = [];
    let verify = await Hash.verify(request.input('old_password'), user.password);
    if(!verify) {
      customErrors.push({
          message:"Provided password is incorrect",
          field:"old_password",
          validation:"compare"
        }
      )
    }
    if (validation.fails() || customErrors.length) {
      let errorMessages = (validation.messages() || []).concat(customErrors);
      if(is_ajax) {
        return response.status(422).send(errorMessages)
      }
      session
        .withErrors(errorMessages)
        .flashExcept(['password'])

      return response.redirect('back')
    }

    user.password = await Hash.make(request.input('password'));
    console.log('password', request.input('password'));
    await user.save();

    let msg = 'Your password has been updated successfully';
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

    let token = await auth.attempt(data.email, data.password);

    return is_ajax ? response.send({data:token}) : view.render('admin.profile.edit');

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
