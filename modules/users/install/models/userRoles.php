<?php
/**
* autoGenerated on 2011-10-31
* @package models
* @subpackage
* @class userRoles
*/

require dirname(__file__).'/BASE_userRoles.php';

class userRoles extends BASE_userRoles{
	// define here all your user defined stuff so you don't bother updating BASE_userRoles class
	// should also be the place to redefine anything to overwrite what has been unproperly generated in BASE_userRoles class
	/**
	* list of filters used as callback when setting datas in fields.
	* this permitt to automate the process of checking datas setted.
	* array('fieldName' => array( callable filterCallBack, array additionalParams, str errorLogMsg, mixed $errorValue=false);
	* 	minimal callback prototype look like this:
	* 	function functionName(mixed $value)
	* 	callback have to return the sanitized value or false if this value is not valid
	* 	logMsg can be retrieved by the metod getFiltersMsgs();
	* 	additionnalParams and errorLogMsg are optionnals and can be set to null to be ignored
	* 	(or simply ignored but only if you don't mind of E_NOTICE as i definitely won't use the @ trick)
	*   $errorValue is totally optional and permit to specify a different error return value for filter than false
	*   (can be usefull when you use filter_var to check boolean for example)
	* )
	*/
	static protected $filters = array(
		'name'=>array(
			'trim'
			,array('match','!^[a-z0-9_-]+$!i','Role name contain invalid characters, allowed characters are a-z A-Z 0-9 _ and -.')
			,array('range',array(3,25),'Role name has to be between 3 to 25 characters long.')
		)
	);

	static protected $modelName = 'userRoles';

	/** formatString to display model as string */
	static public $__toString = '%name';

	/** names of modelAddons this model can manage */
	static protected $modelAddons = array('filters','activable');
	public $_activableFields = array('active');
	/**
	* if true then the model can't have an empty primaryKey value (empty as in php empty() function)
	* so passing an empty PrimaryKey at getInstance time will result to be equal to a getNew call
	*/
	static protected $_avoidEmptyPK = true;
	/**
	* Make use userRoles::$_hasOne and/or userRoles::$_hasMany if you want to override thoose defined in BASE_userRoles
	* any key set to an empty value will be dropped, others will be appended if not exists or override if exists
	* MUST BE PUBLIC (yes it's a shame) but get_class_vars presents bug in some php version
	* static public $_hasOne = array();
	* static public $_hasMany = array();
	*/
	static public $_hasMany = array(
		//   'relName'=> array('modelName'=>'modelName','relType'=>'ignored|dependOn|requireBy','foreignField'=>'fieldNameIfNotPrimaryKey'[,'localField'=>'fieldNameIfNotPrimaryKey','foreignDefault'=>'ForeignFieldValueOnDelete','orderBy'=>'orderBy'=>'fieldName [asc|desc][,fieldName [asc|desc],...]']),
		//or 'relName'=> array('modelName'=>'modelName','linkTable'=>'tableName','linkLocalField'=>'fldName','linkForeignField'=>'fldName','relType'=>'ignored|dependOn|requireBy',['orderBy'=>'fieldName [asc|desc][,fieldName [asc|desc],...]']),
		'userRights' => null
		,'rights' => array(
			 'modelName'=>'userRights'
			,'linkTable'=>'userRoles_userRights'
			,'linkLocalField'=>'userRole'
			,'linkForeignField'=>'userRight'
			,'relType'=>'ignored'
		)
	);

	function onBeforeDelete(){
		if( in_array($this->PK,array(1,2)) ){
			return true; // can't delete user and administrator role
		}
	}

	function hasRight($right,$flush=false){
		if( $right instanceof userRights){
			return $this->rights->hasModel($right);
		}
		if( is_numeric($right) ){
			return $this->rights->filterByRightId($right,'==')->count()>0?true:false;
		}else	if( strpos($right,'.') ){
			return $this->rights->filterBy('FullName',$right)->count()>0?true:false;
		}
		//--finally check for any right in the userRightGroup
		return $this->rights->domain->filterByName($right)->count()>0?true:false;

	}

}
/**
* @class userRolesCollection
*/
class userRolesCollection extends modelCollection{
	/**
	* you can override here default modelCollection methods
	*/
	protected $collectionType = 'userRoles';

	public function __construct(array $modelList=null){
		parent::__construct($this->collectionType,$modelList);
	}
	static public function init(array $modelList=null){
		return new userRolesCollection($modelList);
	}
}