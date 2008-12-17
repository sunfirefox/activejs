/* ***** BEGIN LICENSE BLOCK *****
 * 
 * Copyright (c) 2008 Aptana, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * ***** END LICENSE BLOCK ***** */

ActionView = null;

(function(){

ActionView = {};

ActionView.create = function create(structure,methods)
{
    if(typeof(options) == 'function')
    {
        options = {
            structure: options
        };
    }
    var klass = function klass(){
        this.initialize.apply(this,arguments);
    };
    Object.extend(klass,ClassMethods);
    Object.extend(klass.prototype,methods || {});
    Object.extend(klass.prototype,InstanceMethods);
    klass.prototype.structure = structure || ActionView.defaultStructure;
    Object.Event.extend(klass);
    return klass;
};

ActionView.defaultStructure = function defaultStructure()
{
    return document.createElement('div');
};

ActionView.makeArrayObservable = function makeArrayObservable(array)
{
    Object.Event.extend(array);
    array.makeObservable('shift');
    array.makeObservable('unshift');
    array.makeObservable('pop');
    array.makeObservable('push');
    array.makeObservable('splice');
};

var InstanceMethods = {
    initialize: function initialize(scope,parent)
    {
        this.parent = parent;
        this.scope = scope || {};
        if(!this.scope.get || typeof(this.scope.get) != 'function')
        {
            this.scope = new ObservableHash(this.scope);
        }
        this.builder = Builder.generateBuilder(this);
        this.binding = new Binding(this);
        for(var key in this.scope._object)
        {
            if(Object.isArray(this.scope._object[key]) && !this.scope._object[key].observe)
            {
                ActionView.makeArrayObservable(this.scope._object[key]);
            }
        }
        this.container = this.structure();
        for(var key in this.scope._object)
        {
            this.scope.set(key,this.scope._object[key]);
        }
    },
    get: function get(key)
    {
        this.notify('get',key);
        return this.scope.get(key);
    },
    set: function set(key,value)
    {
        var response = this.scope.set(key,value);
        this.notify('set',key,value);
        return response;
    },
    registerEventHandler: function registerEventHandler(element,event_name,observer)
    {
      this.eventHandlers.push([element,event_name,observer]);
    }
};

var ClassMethods = {

};

var ObservableHash = function ObservableHash(object)
{
    this._object = object || {};
};

ObservableHash.prototype.set = function set(key,value)
{
    this._object[key] = value;
    this.notify('set',key,value);
    return value;
};

ObservableHash.prototype.get = function get(key)
{
    this.notify('get',key);
    return this._object[key];
};

ObservableHash.prototype.toObject = function toObject()
{
    return this._object;
};

Object.Event.extend(ObservableHash);

ActionView.ObservableHash = ObservableHash;

var Builder = {
    tags: ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
        "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
        "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX "+
        "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P "+
        "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD "+
        "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/),
    createElement: function createElement(tag,attributes,view)
    {
        var element;
        element = new Element(tag,attributes);
        Builder.attachElementExtensions(element,view);
        return element;
    },
    attachElementExtensions: function attachElementExtensions(element,view)
    {
        element.observe = element.observe.wrap(function(proceed,event_name,handler){
            view.registerEventHandler(this,event_name,handler);
            return proceed(event_name,handler);
        });
    },
    generateBuilder: function generateBuilder(view)
    {
        var builder;
        builder = {};
        Object.extend(builder,Builder.InstanceMethods);
        Builder.tags.each(function(tag){
            builder[tag.toLowerCase()] = builder[tag] = function tag_generator(){
                var i, argument, attributes, elements, element;
                text_nodes = [];
                elements = [];
                for(i = 0; i < arguments.length; ++i)
                {
                    argument = arguments[i];
                    if(Object.isFunction(argument))
                    {
                        argument = argument();
                    }
                    if(!Object.isString(argument) && !Object.isNumber(argument) && !Object.isArray(argument) && !Object.isElement(argument))
                    {
                        attributes = argument;
                    }
                    else if(Object.isArray(argument))
                    {
                        elements = argument;
                    }
                    else if(Object.isElement(argument) || Object.isString(argument) || Object.isNumber(argument))
                    {
                        elements.push(argument);
                    }
                }
                element = Builder.createElement(tag,attributes,view);
                for(i = 0; i < elements.length; ++i)
                {
                    element.appendChild(Object.isElement(elements[i]) ? elements[i] : document.createTextNode(elements[i]));
                }
                return element;
            };
        });
        return builder;
    }
};

Builder.InstanceMethods = {};
ActionView.Builder = Builder;

var Binding = function Binding(view)
{
    this.view = view;
};

Object.extend(Binding,{
    
});

Object.extend(Binding.prototype,{
    update: function update(element)
    {
        return {
            from: function from(observe_key)
            {
                var transformation = null;
                var condition = function default_condition(){
                    return true;
                };
                
                var transform = function transform(callback)
                {
                    transformation = callback;
                    return {
                        when: when
                    };
                };

                var when = function when(callback)
                {
                    condition = callback;
                    return {
                        transform: transform
                    };
                };

                this.view.scope.observe('set',function update_from_observer(set_key,value){
                    if(observe_key == set_key)
                    {
                        if(condition())
                        {
                            element.innerHTML = transformation ? transformation(value) : value;
                        }
                    }
                });
                return {
                    transform: transform,
                    when: when
                };
            }.bind(this)
        }
    },
    collect: function collect(view)
    {
        /*
        var view = function(){
            var response = view_callback.apply(view_callback,arguments);
            if(typeof(response) == 'string')
            {
                response = document.createTextNode(response);
            }
            return response;
        };
        */
        return {
            from: function from(collection)
            {
                if(typeof(collection) == 'string')
                {
                    collection = this.view.scope.get(collection);
                }
                return {
                    into: function into(element)
                    {
                        var collected_elements = [];
                        for(var i = 0; i < collection.length; ++i)
                        {
                            element.insert(view(collection[i]));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        }
                        collection.observe('pop',function pop_observer(){
                            collected_elements[collected_elements.length - 1].parentNode.removeChild(collected_elements[collected_elements.length - 1]);
                            collected_elements.pop();
                        });
                        collection.observe('push',function push_observer(item){
                            element.insert(view(item));
                            collected_elements.push(element.childNodes[element.childNodes.length - 1]);
                        });
                        collection.observe('unshift',function unshift_observer(item){
                            element.insert({top: view(item)});
                            collected_elements.unshift(element.firstChild);
                        });
                        collection.observe('shift',function shift_observer(){
                            element.removeChild(element.firstChild);
                            collected_elements.shift(element.firstChild);
                        });
                        collection.observe('splice',function splice_observer(index,to_remove){
                            var children = [];
                            var i;
                            for(i = 2; i < arguments.length; ++i)
                            {
                                children.push(arguments[i]);
                            }
                            if(to_remove)
                            {
                                for(i = index; i < (index + to_remove); ++i)
                                {
                                    collected_elements[i].parentNode.removeChild(collected_elements[i]);
                                }
                            }
                            for(i = 0; i < children.length; ++i)
                            {
                                var item = view(children[i]);
                                if(index == 0 && i == 0)
                                {
                                    element.insert({top: item});
                                    children[i] = element.firstChild;
                                }
                                else
                                {
                                    element.insertBefore(typeof(item) == 'string' ? document.createTextNode(item) : item,element.childNodes[index + i]);
                                    children[i] = element.childNodes[i + 1];
                                }
                            }
                            collected_elements.splice.apply(collected_elements,[index,to_remove].concat(children));
                        });
                    }
                };
            }.bind(this)
        };
    }
});

})();