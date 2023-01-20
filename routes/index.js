var express = require('express');
require( 'express-async-errors');
var router = express.Router();
const pg = require("pg");

const postgresConnectionString = 'postgres://postgres:postgres@localhost:5432/messages';

/* GET home page. */
router.get('/', async function(req, res, next) {

  const client = new pg.Client(postgresConnectionString);
  client.connect();

  const sql = 'select * from public.topics order by topicid;';

  let tableView = "<table><tr><th>Topic ID</th><th>Subject</th></tr>";

  try {
    const res = await client.query(sql)
    if (res.rows.length > 0) {
      for(let i = 0; i < res.rows.length; i++) {
        tableView += "<tr><td><a href=\"messages?topicid="+res.rows[i].topicid+"\">"+res.rows[i].topicid+"</a></td><td><a href=\"messages?topicid="+res.rows[i].topicid+"\">"+res.rows[i].subject+"</a></td></tr>";
      }
    } else {
      console.log("No valid topics found.");
    }
  }catch (err) {
    console.log(err.stack)
  }
  res.render('index', { title: 'Minari Yahoo Groups Archive Viewer V1.0',
    table: tableView
  });

});

router.get('/messages', async function(req, res, next) {

  let topicID = req.query.topicid;

  const client = new pg.Client(postgresConnectionString);
  client.connect();

  const sql = 'select * from messages m left join topics t on t.topicid =m.topicid where m.topicid = $1 order by m.msgid ;';
    const values = [topicID];

  let tableView = "<table border='1'><th colspan='4'>Messages</th></tr>";

  try {
    const res = await client.query(sql, values);
    if (res.rows.length > 0) {
      for(let i = 0; i < res.rows.length; i++) {
        let attachmentlinks = "<table>";
        const attachmentsQuery = 'select * from attachments a where messageid = $1;';
        const attachmentsQueryValues = [res.rows[i].msgid];
        const attachmentsReturn = await client.query(attachmentsQuery, attachmentsQueryValues);
        if (attachmentsReturn.rows.length > 0) {
          for(let i = 0; i < attachmentsReturn.rows.length; i++) {
            attachmentlinks += "<tr><td><a href=\"/attachments/"+attachmentsReturn.rows[i].attachmentinternalname+"\">"+attachmentsReturn.rows[i].attachmentfilename+"</a></td></tr>";
          }
        }
        attachmentlinks += "</table>";

        const dateObject = new Date(res.rows[i].postdate * 1000)
        const humanDateFormat = dateObject.toString()
        tableView += "<tr><td>"+humanDateFormat+"</td><td>"+res.rows[i].subject+"</td><td>"+res.rows[i].messagefrom+"</td><td>Attachments</td></tr><tr><td colspan='3'>"+res.rows[i].rawemail+"</td><td>"+attachmentlinks+"</td></tr>";
      }
    } else {
      console.log("No valid topics found.");
    }
  }catch (err) {
    console.log(err.stack)
  }
  res.render('index', { title: 'Minari Yahoo Groups Archive Viewer',
    table: tableView
  });

});

module.exports = router;
