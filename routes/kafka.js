var kafka = require('kafka-node');
var express = require('express');
var isBase64 = require('is-base64');
var debug = require('debug')('ping-tool:kafka');
var fs = require('fs');
var router = express.Router();

/* POST Test Kafka Connection. */
router.post('/', function (req, res, next) {

  debug('Request Body Params');
  //debug(req.body);

  const sslEnabled = req.body.kafka_ssl === 'on';
  debug(`SSL Enabled: ${sslEnabled}`);

  let kafkaCA = req.body.kafka_ca;
  let kafkaCert = req.body.kafka_cert;
  let kafkaKey = req.body.kafka_key;

  // TODO Refactor into a re-usable method
  const kafkaCAIsBase64 = isBase64(req.body.kafka_ca);
  debug(`CA is Base64 Encoded: ${kafkaCAIsBase64}`);
  const kafkaCertIsBase64 = isBase64(req.body.kafka_cert);
  debug(`Cert is Base64 Encoded: ${kafkaCertIsBase64}`);
  const kafkaKeyIsBase64 = isBase64(req.body.kafka_key);
  debug(`Key is Base64 Encoded: ${kafkaKeyIsBase64}`);

  // TODO Refactor into a re-usable method
  if (kafkaCAIsBase64) {
    let buff = new Buffer.from(req.body.kafka_ca, 'base64');
    kafkaCA = buff.toString('ascii');
  }

  if (kafkaCertIsBase64) {
    let buff = new Buffer.from(req.body.kafka_cert, 'base64');
    kafkaCert = buff.toString('ascii');
  }

  if (kafkaKeyIsBase64) {
    let buff = new Buffer.from(req.body.kafka_key, 'base64');
    kafkaKey = buff.toString('ascii');
  }

  let options = {
    "autoConnect": true,
    "clientId": 'kafka-ping-tool',
    "connectTimeout": 1000,
    "kafkaHost": req.body.kafka_url,
    "requestTimeout": 1000,
    "connectRetryOptions": {
      retries: 0
    }
  };

  if (sslEnabled) {
    options.ssl = sslEnabled;
    options.sslOptions = {
      "key": kafkaKey,
      "cert": kafkaCert,
      "ca": kafkaCA
    }
  }

  const client = new kafka.KafkaClient(options);

  /* On Error */
  client.on('error', err => {
    const buffer = fs.readFileSync(process.env.DEBUG_LOG_FILE_PATH + process.env.DEBUG_LOG_FILE_NAME);
    const fileContent = buffer.toString('utf-8', buffer.length - 10000, buffer.length);
    res.render('index', { 
      title: 'Kafka Ping Tool', 
      kafka_url: req.body.kafka_url,
      kafka_ssl: req.body.kafka_ssl,
      kafka_ca: req.body.kafka_ca, 
      kafka_cert: req.body.kafka_cert, 
      kafka_key: req.body.kafka_key, 
      kafka_response: err,
      logs: fileContent
    });
    client.close();
  });

  /* On success */
  client.on('ready', () => {
    res.render('index', { 
      title: 'Kafka Ping Tool', 
      kafka_url: req.body.kafka_url, 
      kafka_ssl: req.body.kafka_ssl,
      kafka_ca: req.body.kafka_ca, 
      kafka_cert: req.body.kafka_cert, 
      kafka_key: req.body.kafka_key, 
      kafka_response: 'Success'
    });
    client.close();
  });
});

module.exports = router;
