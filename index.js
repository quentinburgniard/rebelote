import axios from 'axios';
import cookieParser from 'cookie-parser';
import express from 'express';
import fr from './fr.js';
import morgan from 'morgan';
import { scheduleJob } from 'node-schedule';
import pt from './pt.js';
import Routine from './Routine.js';

const app = express();
const port = 80;

app.disable('x-powered-by');
app.set('view cache', false);
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(express.static('public', { index: false, lastModified: false, maxAge: '7d' }));
app.use(morgan(':method :url :status'));

app.use((req, res, next) => {
  res.locals.token = req.cookies.t || null;
  next();
});

app.use('/:language(fr)', (req, res, next) => {
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

app.get('/', (req, res) => {
  res.redirect(`/${req.acceptsLanguages('fr') || 'fr'}`);
});

app.get('/:language(fr)', (req, res, next) => {
  axios.get(`https://api.digitalleman.com/v2/routines?locale=${req.params.language}`, {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  }).then((response) => {
    res.render('home', {
      routines: response.data.data
    });
  }).catch((error) => {
    res.status(error.response && error.response.status || 500);
    next();
  });
});

app.get('/:language(fr)/:routineID', async (req, res, next) => {
  const routine = new Routine({
    storage: 'strapi',
    token: res.locals.token
  });
  routine.get(req.params.routineID).then((status) => {
    if (status == 200) {
      res.render('routine', {
        routine: routine
      });
    } else {
      res.status(status);
      next();
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
  }).then((response) => {
    res.redirect(`/${req.params.language}/${req.params.routineID}/execution/${response.data.data.id}`);
  }).catch((error) => {
    res.status(error.response && error.response.status || 500);
    next();
  });
});

app.get('/:language(fr)/:routineID/execution/:executionID', (req, res) => {
  axios.get(`https://api.digitalleman.com/v2/routine-executions/${req.params.executionID}?populate[0]=routine&populate[1]=routine.steps&populate[2]=stepExecutions&populate[3]=stepExecutions.step`, {
    headers: {
      'authorization': `Bearer ${res.locals.token}`
    }
  }).then((response) => {
    res.render('routine-execution', {
      routineExecution: response.data.data
    });
  }).catch((error) => {
    res.status(error.response && error.response.status || 500);
    next();
  });
});

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
        }).then((response) => {
          axios.post('https://api.sendgrid.com/v3/mail/send', {
            personalizations: [{
              dynamic_template_data: {
                message: `https://rebelote.digitalleman.com/fr/1/execution/${response.data.data.id}`,
                subject: `🔔 ${routine.attributes.title}`
              },
              to: [{
                email: routine.attributes.user.data.attributes.email
              }],
            }],
            from: {
              email: 'email@digitalleman.com',
              name: 'Rebelote'
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
  if (/401|403/.test(res.statusCode)) {
    res.redirect(`https://id.digitalleman.com/${res.locals.language}?r=rebelote.digitalleman.com${encodeURIComponent(req.path)}`);
  } else {
    res.status(404);
    res.send();
  }
});

app.use((err, req, res, next) => {
  res.status(500);
  res.send();
});

app.listen(port);