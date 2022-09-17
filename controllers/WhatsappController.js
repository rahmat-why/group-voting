import response from './../response.js'
import request from 'request';
import { execute } from './GroupingController.js'

export const sendMessage = async(receiver, content_text) => {
    console.log(receiver);
    var options = {
        'method': 'POST',
        'url': 'https://api.angel-ping.my.id/chats/send-group',
        'headers': {
            'angel-key': 'ECOM.c9dc7e39c892544e815',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "receiver": receiver,
            "message": content_text
        })
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
    });

    return 1
}

export const webhook = async(req, res) => {
    // trigger pesan masuk
    // {
    //    "key":{
    //         "groupId":"120363025472364179",
    //         "telp":"6289636286462",
    //         "name": "E-bot",
    //         "message":"Text Message",
    //         "fromMe":false,
    //         "id":"874880F50DAB1A1C958C10064264547D"
    //     }
    // }

    const json = req.body
    const group_id = json.key.groupId
    const telp = json.key.telp
    const name = json.key.name
    const message = json.key.message
    const customer = {
        telp: telp,
        push_name: name
    }

    await execute(group_id, message, customer)

    res.json("success")
}