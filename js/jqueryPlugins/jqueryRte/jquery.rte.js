/**
* a simple and lightweight rich text editor
* @author jonathan gotti < jgotti at jgotti dot org >
* @licence double licence GPL / MIT
* @package jqueryPlugins
* @since 2008-01
* this work is inspired from:
* - jQuery RTE plugin by 2007 Batiste Bieler (http://batiste.dosimple.ch/blog/2007-09-11-1/)
* - jquery.wisiwyg by Juan M Martinez (http://private.tietokone.com.ar/jquery.wysiwyg/)
* @svnInfos:
*            - $LastChangedDate$
*            - $LastChangedRevision$
*            - $LastChangedBy$
*            - $HeadURL$
* @changelog
*            - 2009-01-22 - bug correction that made certain ie6 version to loose link to this.editable after designMode is set to on
*            - 2008-04-15 - now classOption can also refer to callback user function
*            - 2008-02-22 - set frameBody height to 100% (permit to click anywhere instead of firstline only in firefox when empty)
*            - 2008-02-22 - now you can set button that are present in toolbar
*            - 2008-01-30 - new methods createElement, hasSelection, removeLink
*/

(function($){

	$.fn.rte = function(options) {
		// if doable we transform textarea to rich text editors
		if(document.designMode || document.contentEditable){
			// iterate and reformat each matched element
			return this.each(function() {
				RTE($(this),options);
			});
		}else{
			return this;
		}
	}

  function RTE(elmt, options ){
		return this instanceof RTE ? this.init(elmt,options): new RTE(elmt, options);
	}

	$.extend(RTE.prototype,{
		container: null,
		textarea: null,
		opts:     $.fn.rte.defaults,
		iframe:   null,
		editable: null,
		content:  '',
		toolbar:  '',
		id:       '',
		init: function(elmt,options){
			// prepare options without overriding default ones
			this.opts     = $.extend({}, $.fn.rte.defaults, options);
			this.opts._buttonExp = new RegExp('.*('+this.opts.buttonSet+').*','i'); // used internally to easily [en/dis]able some buttons
			this.id       = elmt.attr('id')?elmt.attr('id'):(elmt.attr('name')?elmt.attr('name'):'');
			this.textarea = elmt;
			// create iframe elments
			this.initIframe()
				.initToolBar()     // create toolbar elements
				.arrangeElements() //put all together
				.initIframe();     // set iframe content and make it editable.
			this.initEventHandlers();
			this.toggleEditMode();

		},

		initIframe: function(){
			if(! this.iframe){
				this.iframe = document.createElement("iframe");
        this.iframe.frameBorder=0;
        this.iframe.frameMargin=0;
        this.iframe.framePadding=0;
				this.iframe.id = 'RTE_FRAME_'+this.id;
				$(this.iframe)
					.width(this.textarea.width())
					.height(this.textarea.height());
			}else{
				var css = this.opts.css_url?"<link type='text/css' rel='stylesheet' href='"+this.opts.css_url+"' />":'';
				this.content = this.textarea.val();
				if($.trim(this.content)=='' && ! $.browser.msie){// Mozilla need this to display caret
					this.content = '<br />';
					this.textarea.parent('form').bind('submit',{rte:this},function(e){
						var t=e.data.rte.textarea;t.val(t.val().replace(/(^<br( \/)?>|<br( \/)?>$)/,''));
						return true;
					});
				}
				var contentDoc = window.document.getElementById(this.iframe.id).contentDocument;
				if(contentDoc){
					this.editable = contentDoc;
				}else{// IE
					this.editable = window.document.frames[this.iframe.id].document;
				}
				this.editable.open();
				this.editable.write('<?xml version="1.0" encoding="UTF-8" ?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><head>'+css+"</head><body class='frameBody' style='height:100%;margin:0;'>"+this.content+"</body></html>");
				this.editable.close();
				this.editable.contentEditable = 'true';
				this.editable.designMode = 'on';
				if(! contentDoc)// some ie6 version may loose this.editable after setting designMode to on so relink it
					this.editable = window.document.frames[this.iframe.id].document;
			}
			return this;
		},

		arrangeElements: function(){
			this.container = $('<div class="rte" id="RTE_'+this.id+'"></div>');
			this.container.width(this.opts.width!=0 ? this.opts.width : this.textarea.width())
				.css('text-align','center');
			this.textarea.wrap(this.container).before(this.iframe);
			$(this.iframe).before(this.toolbar);
			this.container.height(this.opts.height!=0 ? this.opts.height : (parseInt(this.textarea.height())+parseInt(this.toolbar.height())+'px'))
			return this;
		},

		initToolBar: function(){
			var formatSel = this.makeSelector('formatSel','Format elements',this.opts.formatOptions);
			var classSel  = this.makeSelector('classSel', 'Style Elements', this.opts.classOptions);
      this.toolbar = $("<div class='toolbar'>"+formatSel+" "+classSel+"&nbsp;&nbsp;</div>");
      return this;
    },

    /** internal helpers to create selectors */
    makeSelector: function(name,empty,opts){
    	if(! this.opts.buttonSet.match(name.replace('Sel','')) )
    		return '';
    	var options = '';
			for(var i in opts){
				options += '<option value="'+opts[i][0]+'">'+opts[i][1]+'</option>';
			}
			if( opts !== '')
				return '<select class="'+name+'">'+(empty!==''?'<option value="" >'+empty+'</option>':'')+options+'</select>';
		},

		appendFormatButton: function(cmd,label,image,className){
			if(cmd==='spacer'){
				this.toolbar.append('&nbsp;&nbsp;');
				return this;
			}
			label = label.replace(/[^\\]"/,'"');
			var img = image?'<img src="'+this.opts.imgPath+image+'" alt="'+label+'" border="0" />':label;
			var b = $('<a href="#" title="'+label+(className?'" class="'+className:'')+'">'+img+' </a>');
			this.toolbar.append(b);
			if( cmd.toString().match(/^(bold|italic|undo|redo|underline|formatblock|removeformat|justify|insert)/i) ){
				if(! cmd.match(this.opts._buttonExp) ){
					b.remove();
					return this;
				}
				b.bind('click',{rte:this},function(e){ e.data.rte.formatText(cmd); return false;});
			}else{
				b.bind('click',{rte:this},cmd);
			}
			return this;
		},

		initEventHandlers: function(){
			var tb = this.toolbar;
			// format selector
			$('select.formatSel', tb).bind('change',{rte:this},function(e){
				var selected = this.options[this.selectedIndex].value;
				e.data.rte.formatText("formatblock", '<'+selected+'>');
			});
      //class selector
			$('select.classSel', tb).bind('change',{rte:this},function(e){
				var selected = this.options[this.selectedIndex].value;
				if(selected != 0){ // add class
					var editable = e.data.rte.editable;
					var _tag = selected.split(':');
					if( _tag[0] === 'func'){
						 eval(_tag[1]+'(e.data.rte);');
					}else{
						var tag  = editable.createElement(_tag[0]);
						if(_tag[1])
							tag.className = _tag[1];
						e.data.rte.surroundContents(tag);
					}
				}
				e.data.rte.syncFromEditor();
			});

			this.appendFormatButton('bold','bold','format-text-bold.png');
				this.appendFormatButton('underline','underline','format-text-underline.png')
				.appendFormatButton('italic','italic','format-text-italic.png')
				.appendFormatButton('spacer')
				.appendFormatButton('insertorderedlist','ordered list','text_list_numbers.png')
				.appendFormatButton('insertunorderedlist','unordered list','text_list_bullets.png')
				.appendFormatButton('spacer');
			/* no undo redo for now seems buggy
			if(! $.browser.msie ){ //--  not implemented under ie sorry for thoose who use it
				this.appendFormatButton('undo','undo','arrow_undo.png')
				.appendFormatButton('redo','redo','arrow_redo.png')
				.appendFormatButton('spacer');
			}*/
			if( this.opts.buttonSet.match(/justify/) ){
				this.appendFormatButton('justifyleft','left alignment','format-justify-left.png')
					.appendFormatButton('justifycenter','centered alignment','format-justify-center.png')
					.appendFormatButton('justifyright','right alignment','format-justify-right.png')
					.appendFormatButton('justifyfull','justify alignment','format-justify-fill.png')
					.appendFormatButton('spacer');
			}
			if( this.opts.buttonSet.match(/link/) ){
				this.appendFormatButton(this.opts.createLink,'create link','link_add.png')
					.appendFormatButton(this.removeLinkCB,'remove link','link_break.png');
			}
			if( this.opts.buttonSet.match(/image/) ){
				this.appendFormatButton(this.opts.insertImage,'insert image','image_add.png');
			}
			if(  this.opts.buttonSet.match(/link|image/) ){
				this.appendFormatButton('spacer');
			}
			if( this.opts.buttonSet.match(/remove/) )
				this.appendFormatButton(this.cleanContents,'remove format','html_delete.png');
			if( this.opts.buttonSet.match(/toggle/) )
				this.appendFormatButton(this.toggleEditModeCB,'toggle edit mode','tag.png','toggle')

			// data synchronisation between textarea/iframe */
      $(this.editable).bind('mouseup',{rte:this},function(e){e.data.rte.syncFromEditor();});
      $(this.editable).bind('keyup',{rte:this},function(e){e.data.rte.syncFromEditor();});
      this.textarea.bind('keyup',{rte:this},function(e){e.data.rte.syncFromTextarea();});


			// set to use paragraph on return to behave same on firefox as on ie.
			this.formatText("insertbronreturn",false);
		},

		/** return a node created in the context of the editable document. */
		createElement: function(tag){
			return this.editable.createElement(tag);
		},

		syncFromTextarea: function(){
			$(this.editable).find('body').html(this.textarea.val());
		},

		syncFromEditor: function(){
			this.setSelectors();
			this.textarea.val($(this.editable).find('body').html());
		},

    setSelectors: function(){
    	if(! this.opts.buttonSet.match(/format|class/) )
    		return;
    	var node = this.getSelectedElement();
    	var classIndex = formatIndex = 0;
    	var classSel = $('select.classSel', this.toolbar).get(0);
    	var formatSel=$('select.formatSel', this.toolbar).get(0);

    	while(node.parentNode && classIndex===0 && formatIndex===0 ){
				var nName = node.nodeName.toLowerCase();
    		if( formatSel && formatIndex === 0 ){
					for(var i=0;i<formatSel.options.length;i++){
						if(nName==formatSel.options[i].value.toLowerCase()){
							formatIndex=i;
							break;
						}
					}
				}
    		if( classSel &&classIndex === 0 ){
					var cName = $(node).attr('class');
					if( cName ){
						for(var i=0;i<classSel.options.length;i++){
							if(nName+':'+cName==classSel.options[i].value){
								classIndex=i;
								break;
							}
						}
					}
				}
				node = node.parentNode;
			}
			if(formatSel)
				formatSel.selectedIndex=formatIndex;
			if(classSel)
				classSel.selectedIndex=classIndex;
			return true;
    },

		toggleEditModeCB: function(e){ e.data.rte.toggleEditMode(); return false},
		toggleEditMode: function(){
			if(this.textarea.is(':visible')){
				this.textarea.hide();;
				$(this.iframe).show();
			}else{
				this.textarea.show();
				$(this.iframe).hide();
			}
			return this;
		},

		/**
		* you must create the node in the editable document context to get it work with ie.
		* you can use the rte.createElement method to achieve this.
		* @param domNode    node the node to add
		* @param bool       returnNode will return node instead of rte instance if set to true
		* @param rangeOject permit you to pass your own rangeObject it's usefull when replacing the default createLink method.
		* @return rte or domeNode depending on returnNode value.
		*/
		surroundContents: function(node,returnNode,rangeObject){
			if(this.textarea.is(':visible'))
				return returnNode?this:node;
			var r = rangeObject?rangeObject:this.getSelectedElement(true);
			if(r){
				if(r.surroundContents){// the normal way
					r.surroundContents(node);
				}else if(r.htmlText!==undefined){ // do it the dirty ie way (dirty hack if you have better way i take it)
					//-- don't ask me why i can't achieve the same thing by using jquery methods (buggy ie drive me crazy)
				//alert(r.htmlText+'/'+r.text);
					var tmpParent = this.createElement('div');
					node.innerHTML += r.htmlText;
					tmpParent.appendChild(node);
					r.pasteHTML(tmpParent.innerHTML);
				}
				this.syncFromEditor();
			}
			return returnNode?this:node;
		},

		insertNode: function(node,returnNode){
			if(this.textarea.is(':visible'))
				return returnNode?this:node;
			var r = this.getSelectedElement(true);
			if(r.insertNode){ // normal way
				r.insertNode(node);
			}else{ // ugly ie hack
				var tmpParent = this.createElement('div');
				tmpParent.appendChild(node);
				r.collapse();
				r.pasteHTML(tmpParent.innerHTML);
			}
			this.syncFromEditor();
			return returnNode?this:node;
		},

		/** really clean content from any tag (called as a callback) */
		cleanContents: function(event){
			var rte = event.data.rte
			if(rte.textarea.is(':visible'))
				return false;
			r = rte.getSelectedElement(true);
			if(r.htmlText!==undefined){
				r.text = r.text;
			}else if(r.extractContents !== undefined && r.insertNode !== undefined){
				var tmp = r.extractContents();
				$(tmp).children().each(function(){
					$(this).replaceWith($(this).text());
				});
				r.insertNode(tmp);
			}else{
				rte.formatText('removeFormat');
			}
			rte.syncFromEditor();
			return false;
		},

		hasSelection: function(){
			var r = this.getSelectedElement(true);
			if(r.htmlText !== undefined)
				return r.htmlText===''?false:true;
			return ( r.toString() == '')?false:true;

		},
		removeLinkCB: function(e){ return e.data.rte.removeLink(); },
		removeLink: function(){
			var p = this.getSelectedElement();
			if(p.tagName !== undefined && p.tagName.match(/a/i)){
				$(p).replaceWith(p.innerHTML);
			}else{
				p = $(p).parent('a');
				p.replaceWith(p.html());
			}
			this.syncFromEditor();
		},

		/** return the parent node of the selection or range if returnRange is true */
    getSelectedElement: function(returnRange) {
			if(this.textarea.is(':visible'))
				return false;
			if(this.editable.selection) { // IE selections
				selection = this.editable.selection;
				range = selection.createRange();
				try {
					node = range.parentElement();
				}catch(e){
					return false;
				}
			}else{ // Mozilla selections
				try {
					selection = this.iframe.contentWindow.getSelection();
					range = selection.getRangeAt(0);
				}catch(e){
					return false;
				}
				node = range.commonAncestorContainer;
			}
			return returnRange?range:node;
    },

		formatText: function(command, option) {
			if(this.textarea.is(':visible'))
				return this;
			$(this.editable).focus();
			try{
				this.editable.execCommand(command, false, option?option:null);
			}catch(e){console.log(e)}
			$(this.editable).focus();

			// quick and dirty hack to avoid empty tags when trying to remove formatblocks
			if(command === 'formatblock' && option === '<>'){
				this.syncFromEditor();
				var val = this.textarea.get(0).value;
				this.textarea.get(0).value = val.replace(/<<>>|<\/<>>/g,'');
				this.syncFromTextarea();
			}

			this.syncFromEditor();
		}

	});

	// plugin defaults settings
	$.fn.rte.defaults = {
		css_url: '',
		imgPath: '/js/jqueryPlugins/jqueryRte/',
		width:0,
		height:0,
		/** thoose are the commonly accepted values that work */
		formatOptions: [
			['P', 'Paragraph'],
			['PRE', 'Preformatted'],
			['ADDRESS','Address'],
			['H1','Title 1'],
			['H2','Title 2'],
			['H3','Title 3 '],
			['H4','Title 4'],
			['H5','Title 5'],
			['H6','Title 6']
		],
		/**
		* classOptions si a list of format tags with specified class like this
		* array[ 'tagName:className','display label']
		* but can also be used to call your own callback function like this:
		* ['func:jsfunctionName','display label']
		* the callback function will receive rte object as first argument.
		* you should define the function like this:
		* jsfunctionName = function(rte){};
		*/
		classOptions: [
			['span:title','title'],
      ['div:test','test']
		],
		/**
		* set what are viewable or not in toolbar (you can't reorder them just make them available or not
		* list of available buttons/selector separated by pipes possible values are:
		* format | class | bold | underline | italic | orderList | unorderList
		* justify (enable all justify buttons)
		* link | image | remove | toggle
		*/
		buttonSet: 'format|class|bold|underline|italic|orderedList|unorderedList|justify|link|image|remove|toggle',
		/** overwritable callback function */
		createLink: function(e){
			var rte = e.data.rte;
			var url = prompt('Insert link URL');
			if(url.length)
				rte.formatText('createlink',url);
			return false;
		},
		insertImage: function(e){
			var rte = e.data.rte;
			var url = prompt('Insert image URL');
			if( url.length){
				var i = rte.createElement('img');
				i.src = url;
				rte.insertNode(i);
			}
			return false;
		}
	};

})(jQuery);
