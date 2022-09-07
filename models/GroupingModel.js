// import sequelize 
import { Sequelize } from "sequelize";
// import connection 
import database from "../config/database.js";

const Collections = database.define('collections', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  event_id: Sequelize.STRING,
  group_id: Sequelize.STRING,
  collection_number: Sequelize.STRING,
  collection_name: Sequelize.STRING
});

const CollectionMembers = database.define('collection_members', {
    telp: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    collection_id: Sequelize.STRING
});

const Customers = database.define('customers', {
    telp: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    profile_picture: Sequelize.STRING,
    push_name: Sequelize.STRING
});

const Events = database.define('events', {
    event_id: {
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    group_id: Sequelize.STRING,
    event_name: Sequelize.STRING,
    close_at: Sequelize.STRING,
    created_by: Sequelize.STRING,
});

const Groups = database.define('groups', {
    group_id: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    last_state: Sequelize.STRING
});

const Messages = database.define('messages', {
    message_id: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    content: Sequelize.STRING
});

const States = database.define('states', {
    state_id: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
    state_name: Sequelize.STRING,
    message_id: Sequelize.STRING,
    state_type: Sequelize.STRING,
    option: Sequelize.STRING
});

const LogWebhooks = database.define('log_webhooks', {
  id: {
      primaryKey: true,
      type: Sequelize.INTEGER,
  },
  response: Sequelize.STRING,
  from: Sequelize.STRING
});

export {
    Collections,
    CollectionMembers,
    Customers,
    Events,
    Groups,
    Messages,
    States,
    LogWebhooks
};