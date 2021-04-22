const express = require('express');
const commands = require('../lib/commandHandler');
const twitch = require('../lib/twitchCredentials');
const router = express.Router();
const { mode } = require('../../keys');
const alert = require('../../index');

let twitchUser;

router.get('/', async (req, res) => {
  // Obtener la información del usuario desde el header de Nightbot
  try {
    twitchUser = twitch.getTwitchUser(req.headers);
  } catch (error) {
    // Si el modo developer esta desactivado se prohibe el acceso desde fuera de twitch
    if (!Number(mode.developer)) {
      return res.send('Acción bloqueada por administrador ᕦ(ò_óˇ)ᕤ');
    }

    // Si el modo developer esta acrivado se usa un header predefinido para trabajar desde el localhost
    const header = {
      'nightbot-user': 'name=t_songbird&displayName=T_Songbird&provider=twitch&providerId=195003953&userLevel=owner',
      'nightbot-channel': 'name=t_songbird&displayName=T_Songbird&provider=twitch&providerId=195003953'
    };
    twitchUser = twitch.getTwitchUser(header);
  }

  // Obtener los valores del request que empieza por /?q=
  const { q: query } = req.query;

  // Si no existe un request, es decir se llamo "/" mostrar este mensaje (no existe funcionalidad)
  if (query === undefined) {
    return res.send('No hay nada que ver aqui (￣o￣) . z Z');
  }

  // Separar los argumentos del request en 3 secciones definidas
  const [command, message, userLevel] = query.split(' ');

  // Si no se llamo un comando, es decir !q solo, mostrar este mensaje
  if (command === '') {
    return res.send('No tienes el suficiente poder para usar este comando ᕦ(ò_óˇ)ᕤ');
  }

  // Obtener funcion del comand deseado, si no existe mostrar un mensaje
  const { response } = commands[command] || { response: 'Este comando no existe ¯\\_(ツ)_/¯' };

  // Mostrar el mensaje del comando deseado, haciendo distinción si es función o solo texto
  if (typeof response === 'function') {
    const data = await response(twitchUser, message, userLevel);

    if (typeof data === 'object') {
      if (data.sound === true) {
        alert.sound();
        return res.send(`@${twitchUser.displayName}: ${data.message}`);
      } else {
        alert.refresh();
        return res.send(`@${twitchUser.displayName}: ${data.message}`);
      }
    }

    return res.send(`@${twitchUser.displayName}: ${data}`);
  } else if (typeof response === 'string') {
    return res.send(response(twitchUser, message, userLevel));
  }
  // return res.render('links/index', { message: `@${twitchUser.displayName}: ${await response(twitchUser, message, userLevel)}` });
  // return res.render('links/index', { message: response(twitchUser, message, userLevel) });
});

router.post('/', async (req, res) => {
  const { q: query } = req.query;
  const [, userId, method] = query.split(' ');

  const message = await commands.removeById.response(userId, method);

  res.send(`${message.message}`);
});

module.exports = router;
