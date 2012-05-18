var Q = require('q');
var Schema = require('jugglingdb').Schema;
Schema.prototype.define = wrap(Schema.prototype.define).with(promisify);

function promisify(model){
    var asyncs = ['exists', 'count', 'destroyAll', 'create', 'upsert', 'updateOrCreate', 
        'find', 'all', 'findOne'];
    asyncs.forEach(function(key){
        model[key] = maybeAsync(model[key], model, key);
    });


    model.prototype.save = maybeAsync(model.prototype.save, 'save');
    //isValid
    //destroy
    model.prototype.destroy = maybeAsync(model.prototype.destroy, 'destroy');
    //updateAttribute
    //updateAttributes
    //reload


    var oldBelongsTo = model.belongsTo;
    model.belongsTo = function(name, params){
        oldBelongsTo.apply(this, arguments);
        var oldGetOwner = model.prototype[params.as];
        model.prototype[params.as] = function(value){
            if(value) return oldGetOwner.call(this, value);
            else return maybeAsync(oldGetOwner, this, params.as)();
        }
    };



    return model;
}
function promiseItems(items){
    if(!items) return items;
    return items.map(promiseItem);
}
function promiseItem(item){
    if(!item) return item;

    return item;
}

function maybeAsync(fun, self, name){
    if(typeof self === 'string'){
        name = self;
        self = null;
    }
    return function(){
        if(arguments.length > 0 && 
            typeof arguments[arguments.length-1] === 'function'){
            return fun.apply(self||this, arguments);
        }else{
            console.log((name||'maybe async'), arguments);
            var args = Array.prototype.slice.call(arguments,0);
            var deferred = Q.defer();
            args.push(deferred.makeNodeResolver());
            fun.apply(self||this, args);
            return deferred.promise;
        }
    }
}

function wrap(inner, self){
    return {
        with:function(outer){
            return function(){
                return outer(inner.apply((self || this), arguments));
            };
        },then:function(outer){
            return function(){
                return Q.when(inner.apply((self || this), arguments), outer);
            };
        }
    }
}
module.exports = require('jugglingdb');