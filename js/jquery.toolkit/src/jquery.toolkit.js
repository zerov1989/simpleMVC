/**
new javascript widget toolkit based on jquery.
This work is largely inspired by jquery-ui and so you may wonder why another library ?
The answer is not good or bad, just that i like jquery-ui but sometimes i desire to make things differently
for example i like to drive most of enhancement just by giving classnames to my basic markup and that particular stuff
was rejected by the jquery-ui team. As another example many users claim for some additions in the base css-framework
like a ui-state-success or something like that but this was also rejected by the team. Other stuffs like thoose ones
was really missing to better stick to my way of doing things so i start this new library.
( Don't misandurstood me jquery-ui is great library and the base of Tk is largely taken from it. )

@author jonathan gotti <jgotti at jgotti dot net>
@licence Dual licensed under the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.

@changelog
 - 2010-02-10 - add urlElementLevel to storableOptions
 - 2010-01-26 - add uniqueId method and use it for any element promoted to widget that haven't id already set

*/

(function($){

	var _dbg_ = true;
	window.dbg = function(){
		if(! _dbg_ ){
			return false;
		}
		if( console && console.debug){
			console.debug(dbg.caller,arguments);
		}
	};

$.toolkit = function(pluginName,prototype){
	//-- make nameSpace optional default to tk.
	var nameSpace = 'tk';
	if( pluginName.indexOf('.')){
		pluginName = pluginName.split('.');
		nameSpace = pluginName[0];
		pluginName= pluginName[1];
	}
	//-- make plugin initializer and put it in the given namespace
	if( undefined===$[nameSpace]){
		$[nameSpace]={};
	}
	$[nameSpace][pluginName] = function(elmt,options) {
		var self = this;
		self._tk ={
			nameSpace : nameSpace,
			pluginName: pluginName,
			baseClass : nameSpace+'-'+pluginName,
			initialized:false
		};
		self.elmt = $(elmt);
		self.elmt.data(pluginName,self);
		//-- merge options
		var inlineOptions = self._classNameOptions?$.toolkit._readClassNameOpts(self.elmt,self._tk.baseClass,self._classNameOptions):{};
		self.elmt.addClass(self._tk.baseClass);
		self.options=$.extend(
			{},
			$[nameSpace][pluginName].defaults||{},
			inlineOptions,
			options||{}
		);

		if( self._storableOptions && (! self.options.disableStorage) && $.toolkit.storage && $.toolkit.storage.enable() ){
			if( self._storableOptions.pluginLevel ){
				var v = '',pStored=self._storableOptions.pluginLevel.split(/[,\|]/);
				for(var i=0;i<pStored.length;i++ ){
					v = $.toolkit.storage.get(self._tk.pluginName+'_'+pStored[i]);
					if( null !== v){
						self.options[pStored[i]]=v;
					}
				}
			}
			var id = self.elmt.attr('id'),
			v ='',eStored='',encodedUri=escape(window.location.href);
			if( id.length < 1){
				id = $.toolkit.uniqueId();
				self.elmt.attr(id);
			}
			if( id && self._storableOptions.elementLevel){
				eStored=self._storableOptions.elementLevel.split(/[,\|]/);
				for(var i=0;i<eStored.length;i++ ){
					v = $.toolkit.storage.get(self._tk.pluginName+'_'+eStored[i]+'_'+id);
					if( null !== v){
						self.options[eStored[i]]=v;
					}
				}
			}
			if( id && self._storableOptions.urlElementLevel){
				eStored=self._storableOptions.urlElementLevel.split(/[,\|]/);
				for(var i=0;i<eStored.length;i++ ){
					v = $.toolkit.storage.get(self._tk.pluginName+'_'+eStored[i]+'_'+id+'_'+encodedUri);
					if( null !== v){
						self.options[eStored[i]]=v;
					}
				}
			}
		}

		if( $.isFunction(self._init) ){
			self._init();
		}
		self._tk.initialized=true;
	};
	//-- extends plugin methods
	$[nameSpace][pluginName].prototype = $.extend(
		{}, //-- create a new class
		$.toolkit.prototype, //-- extend it with base tk prototype
		prototype //-- finally add plugin own methods
	);

	//-- expose plugin function to the world
	$.fn[pluginName] = function(){
		var method = null,propName=null,onlyOne=false;
		if( typeof arguments[0] === "string"){
			method = Array.prototype.shift.call(arguments,1);
			if( method.match(/^_/)){ //-- avoid call to pseudo private methods
				return this;
			}
			var ret = method.match(/^(get|return)/)?true:false;
			if(! $.isFunction($[nameSpace][pluginName].prototype[method]) ){
				var match = method.match(/^([sg]et|return)(1)?(?:_+(.*))?$/);
				if( null === match){
					return this;
				}
				propName = match[3]?match[3]:Array.prototype.shift.call(arguments,1);
				method   = ('return'===match[1])?propName:match[1];
				onlyOne  = match[2]?true:false
			}
		}
		var args = arguments,
			res = [];
		//- var res = new Array;
		this.each(function(i){
			var instance = $.toolkit._getInstance(this, nameSpace+'.'+pluginName, method?true:(args[0]||{}));
			if( method && $.isFunction(instance[method]) ){
				switch(method){
					case 'get':
						res[i] = instance.get(propName);break;
					case 'set':
						if( propName ){
							instance.set(propName,args[0]);break;
						}
						// continue to default intentionnaly
					default:
						res[i] = instance[method].apply(instance,args);
				}
			}
		});
		return ret?(onlyOne?res[0]:res):this;
	};
};

/**
* Common toolkit plugins prototypes
*/
$.toolkit.prototype = {
	_tk:{
		nameSpace:null,
		pluginName:'tkplugin',
		baseClass:'tk-plugin',
		initialized:false
	},
	/*
	// optional options and their values that may be applyed by element's class attribute. (init options will overwrite them)
	_classNameOptions: {
		optName:'optValue1|optValue2|...optValueN'
	},
	_storableOptions:{ // if set options names given there will try to save their state using available $.toolkit.storage api if enable
		pluginLevel:'optName, ...',    // thoose ones will be stored for all plugin instance
		elementLevel:'optName, ...'    // thoose ones will be stored for each plugin instance depending on their element id attribute.
		urlElementLevel:'optName, ...' // thoose ones will be stored for each plugin instance depending on the url + element id .
	}
	*/
	elmt:null,
	options:{
		disableStorage:false
	},
	// played only once by elmt
	_init: function(){},
	// effectively apply settings by calling set on given options names.
	// additional parameter ifNotDefault will only apply settings if different from default.
	_applyOpts: function(names,ifNotDefault){
		if( typeof names === 'string'){
			names = names.split(/[|,]/);
		}
		if(! ifNotDefault){
			for(var i=0;i<names.length;i++){
				this.set(names[i],this.options[names[i]]);
			}
			return this;
		}
		var defaults = $[this._tk.nameSpace][this._tk.pluginName].defaults;
		for(var i=0;i<names.length;i++){
			if( defaults[names[i]] !== this.options[names[i]] ){
				this.set(names[i],this.options[names[i]]);
			}
		}
		return this;
	},
	//-- event management --//
	_trigger: function(eventName, originalEvent, params){
		//- var e = $.extend(originalEvent || {},{type:(eventName.indexOf(this._tk.pluginName)===0?eventName:this._tk.pluginName+'-'+eventName)});
		//- return this.elmt.triggerHandler(e,params);
		if( undefined===params){
			params = [this.elmt];
		}
		switch( eventName.indexOf('_')){
			case -1:
				eventName = this._tk.pluginName+'_'+eventName;break;
			case 0:
				eventName = eventName.substr(1);break;
			default://do nothing
		}
		var e = $.event.fix(originalEvent||{});
		e.type = eventName;
		return this.elmt.triggerHandler(e,params);
	},
	//-- Exposed methods --//
	get:function(key){
		if( $.isFunction(this['_get_'+key])){
			return this['_get_'+key]();
		}
		return ( typeof this.options[key] !== 'undefined')?this.options[key]:undefined;
	},
	set:function(key,value){
		if( typeof key === 'object'){
			var _key='';
			for( k in key){
				this.set(k,key[k]);
			}
			return;
		}
		if( $.isFunction(this['_set_'+key]) ){
			var v = this['_set_'+key](value);
			if( undefined !== v){
				value = v;
			}
		}
		if( typeof this.options[key] !== 'undefined'){
			this.options[key] = value;
		}
		if( this._storableOptions && (! this.options.disableStorage) && $.toolkit.storage && $.toolkit.storage.enable() ){
			var exp = new RegExp('(^|,|\\|)'+key+'($|,|\\|)');
			if( this._storableOptions.pluginLevel && this._storableOptions.pluginLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key,value);
			}else if( this._storableOptions.elementLevel && this._storableOptions.elementLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key+'_'+this.elmt.attr('id'),value);
			}else if( this._storableOptions.urlElementLevel && this._storableOptions.urlElementLevel.match(exp) ){
				$.toolkit.storage.set(this._tk.pluginName+'_'+key+'_'+this.elmt.attr('id')+'_'+escape(window.location.href),value);
			}
		}
	}
};

//-- TOOLKIT HELPER METHODS --//
$.toolkit.initPlugins = function(pluginNames){
	if(typeof pluginNames === 'string'){
		pluginNames = pluginNames.split(/[|,]/);
	}
	for( var i=0,l=pluginNames.length,p='';i<l;i++){
		p=pluginNames[i];
		eval("jQuery('.tk-"+p+"')."+p+"()");
	}
};
/**
* allow to be sure to get a plugin instance from plugin instance or element on which the plugin is applyied.
* @param object  elmt         the pluginInstance or the element we want the plugin instance of
* @param string  pluginName   the plugin full name with namespace (namespace.pluginname) namespace will default to tk if not passed.
* @param mixed   defaultToNew if passed as true will ensure to return a plugin instance even on element with no plugin already attached.
*                             if passed as object will be considered as options for new instance creation (only if no attached instance is found)
* return pluginInstance or undefined
*/
$.toolkit._getInstance = function(elmt,pluginName,defaultToNew){
	var nameSpace = 'tk';
	if( pluginName.indexOf('.') ){
		pluginName = pluginName.split('.');
		nameSpace = pluginName[0];
		pluginName= pluginName[1];
	}
	if( elmt instanceof $[nameSpace][pluginName]){
		return elmt;
	}
	var instance = $.data(elmt,pluginName);
	if( instance ){
		//dbg('living '+pluginName+' Instance found for',elmt,instance);
		return instance;
	}else if(defaultToNew){
		//dbg('living '+pluginName+' Instance NOT found for',elmt,instance);
		return new $[nameSpace][pluginName](elmt,typeof(defaultToNew)==='object'?defaultToNew:undefined);
	}
	return undefined;
};

/**
* read extra options settings in widget.element's class attribute and return them as object
* @param domElement elmt        the dom or jquery element on which to look class attribute.
* @param string     baseClass   is the plugin baseClass we search for extended version
*                               (ie: baseClass tk-pluginName will look for any tk-pluginName-* class attribute),
* @param array      optionsList an associtive list of optionNames with their possible values separated by a pipe '|'
*                               if an empty value is set at first position it'll be considered optional.
* @return object
*/
$.toolkit._readClassNameOpts=function(elmt,baseClass,optionsList){
	elmt=$(elmt);
	//-- get class attribute if none then return
	var classAttr = elmt.attr('class');
	if( undefined===classAttr || classAttr.length <1){ // nothing to read return
		return {};
	}

	//prepare expression
	var opts={}, optName='', id=0, exp = '(?:^|\\s)'+baseClass+'(?=-)',noCaptureExp = /(^|[^\\])\((?!\?:)/g, oVals;
	for(optName in optionsList ){
		oVals = optionsList[optName].replace(noCaptureExp,'$1(?:');//-- avoid capture parentheses inside expression
		exp += ( oVals.substr(0,1)=='|' )?'(?:-('+oVals.substr(1)+'))?':'-('+oVals+')';
	}
	exp = new RegExp(exp+'(?:$|\\s)');
	var matches = classAttr.match(exp);
	if( null===matches){
		return opts;
	}
	//prepare options objects from matches
	for(optName in optionsList){
		if( matches[++id]){
			opts[optName] = matches[id];
		}
	}
	return opts;
};

/**
* remove matching class names from element and eventually add new class on given element (default to widget.element)
* @param domElement     elmt element on which to work
* @param pseudoRegexp  exp  pseudo expression to search and remove any '*' will be evaluated as alphanum chars, - or _
* @param string        className to also add to the element after removing (shortcut to call $(elmt).addClass() )
* @return jqueryObject
*/
$.toolkit._removeClassExp = function(elmt,exp,add){
	elmt=$(elmt);
	var classAttr = elmt.attr('class');
	if( classAttr ){
		exp = new RegExp('(?:^|\\s)'+exp.replace(/\*/g,'[a-zA-Z_0-9_-]*')+'(?=$|\\s)','g');
		elmt.attr('class',classAttr.replace(exp,''));
	}
	if( undefined!==add ){
		elmt.addClass(add);
	}
	return elmt;
};

/**
* return a unique id for element
*/
$.toolkit.uniqueId = function(){
	if( window.top.$ && window.top.$.toolkit && window.top.$.toolkit._uniqueId )
		return 'tkUID'+(++window.top.$.toolkit._uniqueId);
	window.top.$.toolkit._uniqueId=0;
	return 'tkUID'+window.top.$.toolkit._uniqueId;
}


})(jQuery);
