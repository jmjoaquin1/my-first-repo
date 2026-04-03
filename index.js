'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;
const URL = process.env.URL;

exports.handler = async function(event, context) {
  const key = event.Records[0].s3.object.key;
  if (key.indexOf('thumb/') >= 0) {
    return;
  }

  const data = await S3.getObject({ Bucket: BUCKET, Key: key }).promise();

  const { width } = await Sharp(data.Body).metadata();
  const buffer = await Sharp(data.Body)
    .resize(Math.round(width * 0.5))
    .grayscale() // convert image to black and white
    .sharpen() // enhance edges and improve clarity
    .toFormat('jpeg') // convert image to JPEG format
    .toBuffer();

  await S3.putObject({
    Body: buffer,
    Bucket: BUCKET,
    ContentType: 'image/jpeg',
    Key: `thumb/${key}`,
  }).promise();

  return {
    statusCode: '301',
    headers: { 'location': `${URL}/${key}` },
    body: '',
  };
};

