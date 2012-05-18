var Schema = require('./index.js').Schema;

function getStore(){
    //Attach database stuff to req.
    var store = {};
    var schema = new Schema('memory');
    var define = schema.define.bind(schema);

    //Define tables
    var credential = define('credential', {
        type: String,
        authID: String
    });
    var user = define('user', {
        name:   String, 
    });

    //Define relationships
    credential.belongsTo(user, {as: 'user', foreignKey:'userId'});
    user.hasMany(credential, {as: 'credentials', foreignKey:'userId'});

    //!!MUST BE LAST!!
    //Wrap tables in promises and attach to store
    store.user = user;
    store.credential = credential;

    return store;
}

var store = getStore();
store.user.create({id:'forbes'}).then(function(forbes){
    return store.credential.create({id:'forbesc'}).then(function(forbesc){
        forbesc.user(forbes);
        return forbesc.save();
    }).then(function(cred){
        return cred.user();
    });
}).then(function(user){
    console.log(user);
    return user.credentials.find('forbesc')//store.credential.all().invoke('map',function(v){return v.userId;})
}).then(console.log).end();