<?php
/**
* helper for administration lists
* @changelog
* - 2011-11-02 - allow invalid PK
* - 2010-10-06 - make zebra style rowRendering active even when no editable/deletable
* - 2010-03-16 - supress the lastest column when not editable and not deletable
* - 2009-05-28 - ncancel: added $editable and $deletable parameters.
*/
class adminSortableList_viewHelper extends jsPlugin_viewHelper{

	public $requiredFiles = array('js/sortTable.js');
	public $requiredPlugins = array('jquery');

	static $lastTableId = 0;
	static $actionStr = '/:controller/:action/id/:id';


	function adminSortableList(array $datas=null, array $headers = null, $PK = 'id',$editable=true,$deletable=true){
		if( empty($datas) ){
			return '<div style="font-weight:bold;color:silver;">'.langManager::msg('No item in database please, you must create one first.').'</div>';
		}
		if( is_null($headers) ){
			$headers = array_keys(current($datas));
		}
		foreach($headers as $h){
			if($h===$PK)
				continue;
			$_headers[] = "'".str_replace("'","\'",ucfirst($h))."'";
		}
		$_headers = 'var headers = ['.implode(', ',$_headers).(($editable||$deletable)?",{label:'&nbsp;',unsortable:true,width:'55px'}":'').'];';

		$tableId = 'sortTable'.($this->view->modelType?$this->view->modelType:(++self::$lastTableId));
		$useJsonEncode = function_exists('json_encode');
		foreach($datas as &$row){
			if( isset($row[$PK])){
				$pk = $row[$PK];
				unset($row[$PK]);$row['id'] = $pk;
			}
			if( $useJsonEncode ){
				$row = array_values($row);
			}else{
				$row = "['".implode("', '",array_map(array($this,'escapeDatas'),$row))."']";
			}
		}
		if( $useJsonEncode ){
			$datas  = "var $tableId = ".json_encode($datas).";\n";
		}else{
			$datas   = "var $tableId = [\n        ".implode(",\n        ",$datas)."\n      ];\n";
		}

		$controller = $this->getController()->getName();
		#- $baseUrl = APP_URL.'/'.$controller->getName.'/';
		$msgEdit = htmlentities(langManager::msg('Edit'),ENT_COMPAT,'utf-8');
		$msgDel  = htmlentities(langManager::msg('Delete'),ENT_COMPAT,'utf-8');
		$this->view->_js_script("
			var options = {
				footerString: '<span style=\"float:right;\" class=\"sorttable-pagesize-setting\">".langManager::msg('display %s lines','%psizesel')."</span><div style=\"white-space:nowrap;\" class=\"sorttable-pagenav-settings\">%pnav</div>',
				rowRendering: function(row,data){
					$(row).addClass(data.rowid%2?'row':'altrow');
				".(($editable||$deletable)?"
					var bcell  = row.cells[row.cells.length-1];
					var itemId = data.data[data.data.length-1];
					$(bcell).html('<div class=\"ui-buttonset ui-buttonset-tiny-i\">"
					.($editable?"<button class=\"ui-button ui-button-pencil editButton\" title=\"$msgEdit\">$msgEdit</button>":'')
					.($deletable?"<button class=\"ui-button ui-button-trash delButton\" title=\"$msgDel\">$msgDel</button>":'')
					."</div>');"
					.($editable?"
					$('.editButton',bcell).click(function(){
						window.location = '".APP_URL.str_replace(array(':controller',':action',':id'),array($controller,"edit","'+itemId+'"),self::$actionStr)."';
					});":'')
					.($deletable?"
					$('.delButton',bcell).click(function(){
						if(! confirm('".str_replace("'","\'",langManager::msg("Are you sure you want to delete this item?"))."')){
							return false;
						}
						window.location = '".APP_URL.str_replace(array(':controller',':action',':id'),array("$controller","del","'+itemId+'"),self::$actionStr)."';
						return true;
					});":'')."
				":'')."},
				bodyRendering:function(body,data){
					$('.ui-button',body).button({checkButtonset:true});
				}
			};
			sortTable.init('$tableId',headers,options);
		");
		return "
		<table cellspacing=\"0\" cellpadding=\"2\" border=\"0\" class=\"adminList\" id=\"$tableId\"></table>
		<script type=\"text/javascript\">
			$datas
			$_headers
		</script>
		";
	}

	function escapeDatas($datas){
		return ($datas==='')?'&nbsp;':preg_replace(array("/(?<!\\\\)'/","!\r?\n!"),array("\'","\\n"),"$datas");
	}
}
