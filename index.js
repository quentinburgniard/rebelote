import axios from 'axios';
import cookieParser from 'cookie-parser';
//import crypto from 'crypto';
import express from 'express';
import fr from './fr.js';
import morgan from 'morgan';
import { scheduleJob } from 'node-schedule';
import pt from './pt.js';

//import qs from 'qs';

const app = express();
const port = 80;

app.disable('x-powered-by');
//app.set('env', 'development');
app.set('view cache', false);
app.set('view engine', 'pug');
app.use(cookieParser());
//app.use(express.json());
//app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public', { index: false, lastModified: false, maxAge: '7d' }));
app.use(morgan(':method :url :status'));

app.use((req, res, next) => {
  res.locals.token = req.cookies.t || null;
  next();
});

app.use('/:language(en|fr|pt)', (req, res, next) => {
  res.locals.language = req.params.language;
  res.locals.path = req.path.replace(/\/$/, '');
  res.locals.__ = (key) => {
    switch (res.locals.language) {
      case 'fr':
        return fr[key] || key;
      case 'pt':
        return pt[key] || key;
      default:
        return key;
    }
  }
  next();
});

app.get(/^\/(?!fr)/, (req, res) => {
  res.redirect(`/${req.acceptsLanguages('fr') || 'fr'}${req.originalUrl.replace(/\/$/, '')}`);
});

app.get('/:language(fr)', (req, res) => {
  axios.get(`https://api.digitalleman.com/v2/routines?locale=${req.params.language}`, {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  })
  .then((response) => {
    res.render('home', {
      routines: response.data.data
    });
  })
  .catch((error) => {
    if (/401|403/.test(error.response.status)) {
      res.redirect(`https://id.digitalleman.com?l=${req.params.language}&r=rebelote.digitalleman.com%2F${req.params.language}`);
    } else {
      res.status(error.response.status || 500);
      res.send();
    }
  });
});

app.get('/:language(fr)/:routineID', (req, res) => {
  axios.get(`https://api.digitalleman.com/v2/routines/${req.params.routineID}?populate[0]=executions&populate[1]=executions.stepExecutions&populate[2]=steps`, {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  })
  .then((response) => {
    res.render('routine', {
      routine: response.data.data
    });
  })
  .catch((error) => {
    console.log(error.response.data);
    if (/401|403/.test(error.response.status)) {
      res.redirect(`https://id.digitalleman.com?l=${req.params.language}&r=rebelote.digitalleman.com%2F${req.params.language}%2F${req.params.routineID}`);
    } else {
      res.status(error.response.status || 500);
      res.send();
    }
  });
});

app.get('/:language(fr)/:routineID/execute', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/routine-executions', {
    data: {
      locale: req.params.language,
      routine: req.params.routineID
    }
  },
  {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  })
  .then((response) => {
    res.redirect(`/${req.params.language}/${req.params.routineID}/execution/${response.data.data.id}`);
  })
  .catch((error) => {
    if (/401|403/.test(error.response.status)) {
      res.redirect(`https://id.digitalleman.com?l=${req.params.language}&r=rebelote.digitalleman.com%2F${req.params.language}%2F${req.params.routineID}%2Fexecute`);
    } else {
      res.status(error.response.status || 500);
      res.send();
    }
  });
});

app.get('/:language(fr)/:routineID/execution/:executionID', (req, res) => {
  axios.get(`https://api.digitalleman.com/v2/routine-executions/${req.params.executionID}?populate[0]=routine&populate[1]=routine.steps&populate[2]=stepExecutions&populate[3]=stepExecutions.step`, {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  })
  .then((response) => {
    res.render('routine-execution', {
      routineExecution: response.data.data
    });
  })
  .catch((error) => {
    if (/401|403/.test(error.response.status)) {
      res.redirect(`https://id.digitalleman.com?l=${req.params.language}&r=rebelote.digitalleman.com%2F${req.params.language}%2F${req.params.routineID}%2Fexecution%2F${req.params.executionID}`);
    } else {
      res.status(error.response.status || 500);
      res.send();
    }
  });
});

/*app.post('/:language(en|fr|pt)', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/auth/local', {
    identifier: req.body.email,
    password: req.body.password
  },
  {
    headers: {
      'content-type': 'application/json'
    }
  })
  .then((response) => {
    res.locals.email = response.data.user.email;
    res.locals.token = response.data.jwt;
    res.cookie('t', res.locals.token, { domain: 'digitalleman.com', maxAge: 604200000, path: '/', secure: true });
    if (res.locals.redirect) {
      let redirect = `https://${res.locals.redirect}`;
      if (!redirect.includes('digitalleman.com')) redirect += `?t=${res.locals.token}`;
      res.redirect(redirect);
    } else {
      let messages = [res.locals.__('Login Successful')];
      res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
      res.redirect(`/${res.locals.language}`);
    }
  })
  .catch((error) => {
    let messages = [res.locals.__('Login Failed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.clearCookie('t', { domain: 'digitalleman.com', path:'/' });
    res.redirect(`/${res.locals.language}`);
  });
});

app.get('/:language(en|fr|pt)/change-password', (req, res, next) => {
  if (res.locals.token) {
    res.render('change-password');
  } else {
    next();
  }
});

app.post('/:language(en|fr|pt)/change-password', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/auth/change-password', {
    currentPassword: req.body.currentPassword,
    password: req.body.password,
    passwordConfirmation: req.body.passwordConfirmation
  },
  {
    headers: {
      'authorization': `Bearer ${res.locals.token}`,
      'content-type': 'application/json'
    }
  })
  .then((response) => {
    res.locals.token = response.data.jwt;
    let messages = [res.locals.__('Password Changed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.cookie('t', res.locals.token, { domain: 'digitalleman.com', maxAge: 604200000, path: '/', secure: true });
    res.redirect(`/${res.locals.language}`);
  })
  .catch((error) => {
    let messages = [res.locals.__('Password Change Failed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.redirect(`/${res.locals.language}/change-password`);
  });
});

app.get('/:language(en|fr|pt)/files', (req, res) => {
  if (!res.locals.token) {
    res.redirect(`/${res.locals.language}`);
  } else {
    axios.get('https://api.digitalleman.com/v2/assets', {
      headers: {
        'authorization': `Bearer ${res.locals.token}`
      }
    })
    .then((response) => {
      res.render('files', {
        files: response.data
      });
    });
  }
});

app.get('/:language(en|fr|pt)/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.post('/:language(en|fr|pt)/forgot-password', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/auth/forgot-password', {
    email: req.body.email
  },
  {
    headers: {
      'content-type': 'application/json'
    }
  })
  .then((response) => {
    let messages = [res.locals.__('Reset Password Email Sent')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.redirect(`/${res.locals.language}`);
  })
  .catch((error) => {
    let messages = [res.locals.__('Reset Password Email Failed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.redirect(`/${res.locals.language}/forgot-password`);
  });
});

app.get('/:language(en|fr|pt)/reset-password', (req, res, next) => {
  if(req.query.t) {
    res.locals.token = req.query.t;
    res.render('reset-password');
  } else {
    next();
  }
});

app.post('/:language(en|fr|pt)/reset-password', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/auth/reset-password', {
    code: req.body.token,
    password: req.body.password,
    passwordConfirmation: req.body.passwordConfirmation
  },
  {
    headers: {
      'content-type': 'application/json'
    }
  })
  .then((response) => {
    let messages = [res.locals.__('Your password has been reset')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.redirect(`/${res.locals.language}`);
  })
  .catch((error) => {
    let messages = [res.locals.__('Password reset failed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.redirect(`/${res.locals.language}/reset-password?t=${req.body.token}`);
  });
});

app.get('/:language(en|fr|pt)/sign-out', (req, res) => {
  let messages = [res.locals.__('Sign Out successful')];
  res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
  res.clearCookie('t', { domain: 'digitalleman.com', path:'/' });
  res.redirect(`/${res.locals.language}`);
});

app.get('/:language(en|fr|pt)/sign-up', (req, res) => {
  if (!res.locals.token) {
    res.render('sign-up');
  } else {
    res.redirect(`/${res.locals.language}`);
  }
});

app.post('/:language(en|fr|pt)/sign-up', (req, res) => {
  axios.post('https://api.digitalleman.com/v2/auth/local/register', {
    email: req.body.email,
    password: req.body.password,
    username: req.body.email
  },
  {
    headers: {
      'content-type': 'application/json'
    }
  })
  .then((response) => {
    let messages = [res.locals.__('Please validate your email')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.clearCookie('t', { domain: 'digitalleman.com', path:'/' });
    res.redirect(`/${res.locals.language}`);
  })
  .catch((error) => {
    let messages = [res.locals.__('Registration Failed')];
    res.cookie('m', JSON.stringify(messages), { domain: 'digitalleman.com', path: '/', sameSite: true, secure: true });
    res.clearCookie('t', { domain: 'digitalleman.com', path:'/' });
    res.redirect(`/${res.locals.language}/sign-up`);
  });
});*/

scheduleJob('0 * * * *', (date) => {
  axios.get('https://api.digitalleman.com/v2/routines?locale=fr&pagination[pageSize]=100&populate=user', {
    headers: {
      'authorization': `Bearer ${process.env.TOKEN}`
    }
  })
  .then((response) => {
    response.data.data.forEach((routine) => {
      let trigger = false;
      if (routine.attributes.reminderHour === date.getHours()) {
        switch (routine.attributes.reminderFrequency) {
          case 'daily':
            trigger = true;
            break;
          case 'monthly':
            if (routine.attributes.reminderDay === date.getDate()) trigger = true;
            break;
          case 'weekly':
            if (routine.attributes.reminderWeekday === date.getDay()) trigger = true;
            break;
          case 'yearly':
            if (routine.attributes.reminderMonth === date.getMonth() && routine.attributes.reminderDay === date.getDate()) trigger = true;
            break;
        }
      }
      if (trigger) {
        axios.post(`https://api.digitalleman.com/v2/routine-executions`, {
          data: {
            routine: routine.id
          }
        },
        {
          headers: {
            'authorization': `Bearer ${process.env.TOKEN}`
          }
        })
        .then((response) => {
          axios.post('https://api.sendgrid.com/v3/mail/send', {
            personalizations: [{
              dynamic_template_data: {
                message: `https://rebelote.digitalleman.com/fr/1/execution/${response.data.data.id}`,
                subject: routine.attributes.title
              },
              to: [{
                email: routine.attributes.user.data.attributes.email
              }],
            }],
            from: {
              email: 'email@digitalleman.com',
              name: 'Digital Léman'
            },
            reply_to: {
              email: 'contact@quentinburgniard.com'
            },
            template_id: 'd-4b516a020f0e4af982393dd9542c831a'
          },
          {
            headers: {
              'authorization': `Bearer ${process.env.SENDGRID_TOKEN}`,
              'content-type': 'application/json'
            }
          });
        });
      }
    });
  });
});

app.use((req, res) => {
  res.status(404);
  res.send();
});

app.use((err, req, res, next) => {
  res.status(500);
  res.send();
});

app.listen(port);