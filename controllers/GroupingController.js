import date from 'date-and-time';
import database from "../config/database.js";
import { Sequelize, QueryTypes } from'sequelize'
import { sendMessage } from './WhatsappController.js'

// model
import { Groups, Collections, CollectionMembers, Customers, Events, States, Messages } from "../models/GroupingModel.js";

const now = new Date();
const execute = async (group, text, customer) => {
    const option = await formatOption(text)
    const option_value = await formatOptionValue(text)
    var handle_invalid_option = await handleInvalidOption(option, option_value, customer, group)
    
    if (handle_invalid_option.is_error) {
        return false
    }
    
    let show_group = await showGroup(group)
    
    if (show_group === undefined) {
        var rules_state = await rulesNewGroup(group)
    }else{
        var rules_state = await rulesExistGroup(group, text)
    }

    const execute_option = await executeOption(customer.telp, option, group, text)
    let message_id = rules_state.data.message_id
    let show_message = await showMessage(message_id)
    let receiver = group
    for(let i in show_message) {
        var content_text = await pregMessage(execute_option.event_id, execute_option.collection_id, customer.telp, show_message[i].content_text)
        await sendMessage(receiver, content_text)
        console.log({receiver, content_text})
    }

    return 1;
}

const rulesNewGroup = async(group) => {
    await storeGroup(group, "STATE01")
    const show_state = await showStateType("START")

    let response = {
        data: show_state
    }
    return response
}

const rulesExistGroup = async(group, text) => {
    const option = await formatOption(text)
    const show_state = await showStateOption(option)

    let response = {
        data: show_state
    }
    return response
}

const showGroup = async(group_id) => {
    const groups = await Groups.findAll({ where: { group_id } })

    return groups[0]
}

const storeGroup = async(group_id, last_state) => {
    await Groups.create({
        group_id: group_id,
        last_state: last_state
    })

    return 1
}

const updateGroup = async(group_id, update) => {
    await Groups.update(update, {
        where: {
            group_id: group_id
        }
    });

    return 1
}

const showStateOption = async(option) => {
    const states = await States.findAll({ where: { option } })

    return states[0]
}

const showStateType = async(state_type) => {
    const states = await States.findAll({ where: { state_type } })

    return states[0]
}

const showMessage = async(message_id) => {
    const messages = await Messages.findAll({ where: { message_id } })

    return JSON.parse(messages[0].content)
}

const formatOption = async(text) => {
    var option = text.split(" ")[0]
    var option = option.toLowerCase()

    return option
}

const formatOptionValue = async(text) => {
    var arr_option = text.split(" ")

    var option = ""
    for (let i = 1; i < arr_option.length; i++) {
        option += arr_option[i]+" "
    }

    return option
}

const handleInvalidOption = async(option, option_value, customer, group) => {
    var telp = customer.telp
    var push_name = customer.push_name
    
    let response = {
        is_error: false
    }

    const customers = await Customers.findAll({ where: { telp } })

    if (customers.length === 0) {
        await storeCustomer(telp, null, push_name)
    }

    const valid_option = ["/result", "/guide", "/voting", "/opsi", "/vote", "/close"]
    if (!valid_option.includes(option)) {
        response.is_error = true
    }

    const show_running_event = await showRunningEvent(group)
    const option_running = ["/vote", "/close", "/result"]
    if (option_running.includes(option) && show_running_event === undefined) {
        response.is_error = true
        await executeAlert(group, "ALERT_NOT_RUNNING_EVENT", null, telp)
        return response
    }

    if (option === "/voting") {
        if (show_running_event !== undefined) {
            response.is_error = true
            await executeAlert(group, "ALERT_RUNNING_EVENT", show_running_event.event_id, telp)
        }
    }else if(option === "/vote"){
        var collection_number = option_value
        var event_id = show_running_event.event_id
        const collection_id = await showCollectionId(event_id, collection_number)
        if (collection_id === undefined) {
            response.is_error = true
            await executeAlert(group, "ALERT_NOT_EXIST_COLLECTION", event_id, telp)
        }
    }else if(option === "/opsi") {
        if (show_running_event.created_by !== telp) {
            response.is_error = true
            await executeAlert(group, "ALERT_NOT_AUTHORITY_EVENT", show_running_event.event_id, telp)
        }
    }

    return response
}

const executeOption = async(telp, option, group, text) => {
    var event_id = null
    var collection_id = null
    if(option === "/voting") {
        var event_name = await formatOptionValue(text)
        const store_event = await storeEvent(group, event_name, null, telp)
        var event_id = store_event.event_id
    }else if (option === "/opsi") {
        const show_running_event = await showRunningEvent(group)
        var collection_name = await formatOptionValue(text)
        const store_collection = await storeCollection(show_running_event.event_id, group, collection_name)
        var event_id = show_running_event.event_id
        var collection_id = store_collection.id
    }else if(option === "/vote") {
        var collection_number = await formatOptionValue(text)
        const show_running_event = await showRunningEvent(group)
        const store_collection_member = await storeCollectionMember(telp, collection_number, show_running_event.event_id)
        var event_id = show_running_event.event_id
        var collection_id = store_collection_member.collection_id
    }else if(option === "/close") {
        let current_time = date.format(now, 'YYYY-MM-DD HH:mm:ss');
        let update = {
            close_at:current_time
        }
        const show_running_event = await showRunningEvent(group)
        await updateEvent(show_running_event.event_id, update)
        var event_id = show_running_event.event_id
    }else if(option === "/result") {
        const show_running_event = await showRunningEvent(group)
        var event_id = show_running_event.event_id
    }

    var data = {
        event_id: event_id,
        collection_id: collection_id
    }
    return data
}

const executeAlert = async(group, state_type, event_id, telp) => {
    let receiver = group
    const show_state = await showStateType(state_type)
    let show_message = await showMessage(show_state.message_id)

    for(let i in show_message) {
        var content_text = await pregMessage(event_id, null, telp, show_message[i].content_text)
        await sendMessage(receiver, content_text)
        console.log('message inside a loop')
        console.log({receiver, content_text})
    }

    return 1
}

const showCollectionId = async(event_id, collection_number) => {
    var collections = await Collections.findAll({
        where: {
            event_id: event_id,
            collection_number: collection_number
        }
    });

    if (collections[0] === undefined) {
        return undefined
    }
    
    return collections[0].id
}

const showCollectionEvent = async(event_id) => {
    const collections_event = await Collections.findAll({ where: { event_id }, order: [[ "collection_number", "ASC" ]] })

    return collections_event
}

const showCollectionMember = async(collection_id) => {
    const collection_members = await CollectionMembers.findAll({ where: { collection_id }, include: [{ model: Customers }], order: [[ "createdAt", "ASC" ]] })

    // https://stackoverflow.com/a/41512504
    collection_members.forEach(obj => { 
        Object.keys(obj.toJSON()).forEach(k => {
            if (typeof obj[k] === 'object') {       
                Object.keys(obj[k]).forEach(j => obj[j] = obj[k][j]);
            }
        });
    });

    return JSON.parse(JSON.stringify(collection_members)) // supaya push_name tidak undefined
}

const storeCollection = async(event_id, group_id, collection_name) => {
    var show_collection = await showCollectionEvent(event_id)
    var collection_number = show_collection.length+1
    const store_collection = await Collections.create({
        id: await randomNumber(),
        event_id: event_id,
        collection_number: collection_number,
        group_id: group_id,
        collection_name: collection_name
    })
    
    return store_collection.dataValues
}

const storeCollectionMember = async(telp, collection_number, event_id) => {
    const collection_id = await showCollectionId(event_id, collection_number)

    // ganti jadi update or insert aja mas, primary key nya telp dan event id, collection join ke collection member
    const store_collection_member = await CollectionMembers.create({
        telp: telp,
        collection_id: collection_id
    })
    
    return store_collection_member.dataValues
}

const storeEvent = async(group, event_name, close_at, telp) => {
    await Events.create({
        event_id: await randomNumber(),
        group_id: group,
        event_name: event_name,
        close_at: close_at,
        created_by: telp
    })

    const show_running_event = await showRunningEvent(group)
    return show_running_event
}

const showRunningEvent = async(group) => {
    var events = await Events.findAll({
        where: {
            group_id: group,
            close_at: null
        }
    });

    return events[0]
}

const updateCollectionMember = async(telp, update) => {
    await CollectionMembers.update(update, {
        where: {
            telp: telp
        }
    });

    return 1
}

const storeCustomer = async(telp, profile_picture, push_name) => {
    await Customers.create({
        telp: telp,
        profile_picture: profile_picture,
        push_name: push_name
    })

    return 1
}

const pregMessage = async(event_id, collection_id, telp, message) => {
    var message = JSON.stringify(message)
    const events = await Events.findAll({ where: { event_id } })
    if (events.length > 0) {
        var message = message.replace(/%event_name%/, events[0].event_name);
    }
    
    const customers = await Customers.findAll({ where: { telp } })

    if (customers.length > 0) {
        var message = message.replace(/%telp%/, customers[0].telp);
        var message = message.replace(/%push_name%/, customers[0].push_name);
    }

    const collections = await Collections.findAll({ where: { id: collection_id } })

    if (collections.length > 0) {
        var message = message.replace(/%collection_name%/, collections[0].collection_name);
    }

    const collections_event = await showCollectionEvent(event_id)
    var result = ""
    for (let i = 0; i < collections_event.length; i++) {
        result += collections_event[i].collection_number+". "+collections_event[i].collection_name+"\\n"
        
        const show_collection_member = await showCollectionMember(collections_event[i].id)

        for (let j = 0; j < show_collection_member.length; j++) {
            result += "- @"+show_collection_member[j].telp+" - "+show_collection_member[j].push_name
        }
    }
    var message = message.replace(/%result%/, result);
    var message = JSON.parse(message)

    return message
}

const randomNumber = async() => {
    return parseInt(Math.random() * (1000 - 9999) + 9999);
}

const updateEvent = async(event_id, update) => {
    await Events.update(update, {
        where: {
            event_id: event_id
        }
    });

    return 1
}

export { execute }