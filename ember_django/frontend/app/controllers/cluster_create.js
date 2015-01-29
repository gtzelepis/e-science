// Cluster/create controller
App.ClusterCreateController = Ember.Controller.extend({

	needs : 'userWelcome',

	// Initialization phase
	project_index : 0, // index (position in the array) of the project
	project_current : '', // current project
	project_name : '', // name of the project
	cluster_size : 0, // Initial cluster size
	cluster_size_var : 0, // Initial cluster size keeper variable
	master_cpu_selection : 0, // Initial master_cpu_selection, appears in master cpu summary
	slaves_cpu_selection : 0, // Initial slaves_cpu_selection, appears in slaves cpu summary
	master_ram_selection : 0, // Initial master_ram_selection, appears in master ram summary
	slaves_ram_selection : 0, // Initial slaves_ram_selection, appears in slaves ram summary
	master_disk_selection : 0, // Initial master_disk_selection, appears in master disk summary
	slaves_disk_selection : 0, // Initial slaves_disk_selection, appears in slaves disk summary
	cluster_name : '', // Initial cluster name, null
	operating_system : 'Debian Base', // Preselected OS
	disk_temp : 'ext_vlmc', // Initial storage selection, common for master and slaves
	cluster_size_zero : false, // for checking the available VMs, cluster size
	create_cluster_disabled : true, // flag to disable create cluster button when project is not selected
	message : '', // message when user presses the create cluster button
	alert_mes_master_cpu : '', // alert message for master cpu buttons (if none selected)
	alert_mes_master_ram : '', // alert message for master ram buttons (if none selected)
	alert_mes_master_disk : '', // alert message for master disk buttons (if none selected)
	alert_mes_slaves_cpu : '', // alert message for slaves cpu buttons (if none selected)
	alert_mes_slaves_ram : '', // alert message for slaves ram buttons (if none selected)
	alert_mes_slaves_disk : '', // alert message for slaves disk buttons (if none selected)
	alert_mes_cluster_name : '', // alert message for cluster name (if none selected)
	alert_mes_cluster_size : '', // alert message for cluster size (if none selected)
	project_details : '', // project details: name and quota(Vms cpus ram disk)
	name_of_project : '', // variable to set name of project as part of project details string helps parsing sytem project name
	vmflavor_selection_Master : '', // Initial vmflavor_selection_Master
	vmflavor_selection_Slave : '', // Initial vmflavor_selection_Slave
    vmflav_disabled_Master : false, // Global variable for handling restrictions
    vmflav_disabled_Slave : false, // Global variable for handling restrictions
    vmflav_masterMedium_disabled : false, // Global variable for handling restrictions
    vmflav_masterLarge_disabled : false, // Global variable for handling restrictions
    vmflav_slaveMedium_disabled : false, // Global variable for handling restrictions
    vmflav_slaveLarge_disabled : false, // Global variable for handling restrictions
    
	// for projects
	projects_av : function() {
		this.reset_variables();
		this.set('project_current', '');
		this.set('project_name', '');
		var projects = [];
		var length = this.get('content.length');
		var regular_exp_project_id = /system:[a-z,0-9]{8}(-[a-z,0-9]{4}){3}-[a-z,0-9]{12}/;
		var max_space = 30;
		var space_separate_project_name_and_quota = String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + 
			String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160);
		var space_between_quota = String.fromCharCode(160) + String.fromCharCode(160);
		for (var i = 0; i < length; i++) {
			var current_space = '';
			if (regular_exp_project_id.test(this.get('content').objectAt(i).get('project_name'))) {
				this.set('name_of_project', 'system');
			} else {
				this.set('name_of_project', this.get('content').objectAt(i).get('project_name'));
			}
			projects[i] = this.get('name_of_project') + space_separate_project_name_and_quota + 
			'VMs:' + this.get('content').objectAt(i).get('vms_av').length + space_between_quota + 
			'CPUs:' + this.get('content').objectAt(i).get('cpu_av') + space_between_quota + 
			'RAM:' + this.get('content').objectAt(i).get('mem_av')  + 'MB' + space_between_quota + 
			'Disk:' + this.get('content').objectAt(i).get('disk_av') + 'GB';
		}
		this.set('name_of_project', '');
		for (var i = 0; i < length; i++) {
			if (regular_exp_project_id.test(this.get('content').objectAt(i).get('project_name'))) {
				this.set('name_of_project', 'system');
			} else {
				this.set('name_of_project', this.get('content').objectAt(i).get('project_name'));
			}
			if ((projects[i] = this.get('name_of_project') + space_separate_project_name_and_quota + 
				'VMs:' + this.get('content').objectAt(i).get('vms_av').length + space_between_quota + 
				'CPUs:' + this.get('content').objectAt(i).get('cpu_av') + space_between_quota + 
				'RAM:' + this.get('content').objectAt(i).get('mem_av')  + 'MB' + space_between_quota + 
				'Disk:' + this.get('content').objectAt(i).get('disk_av') + 'GB') === this.get('project_details')) {
				this.set('create_cluster_disabled', false);
				this.set('project_current', this.get('content').objectAt(i));
				this.set('project_name', this.get('content').objectAt(i).get('project_name'));
				this.set('project_index', i);
				break;
			}
		}
		return projects.sort();
	}.property('project_details'),

	// The total cpus selected for the cluster
	total_cpu_selection : function() {
		return (this.get('master_cpu_selection') + this.get('slaves_cpu_selection') * (this.size_of_cluster() - 1));
	}.property('master_cpu_selection', 'slaves_cpu_selection', 'project_name', 'cluster_size_var'),

	// Computes the available cpu each time total_cpu_selection changes
	cpu_available : function() {
		var cpu_avail = this.get('content').objectAt(this.get('project_index')).get('cpu_av') - this.get('total_cpu_selection');
		if (cpu_avail < 0) {
			alert('The cluster size you selected with the current cpu choices exceed the cpu quota. You should lower the clustersize, change cpu values and select the clustersize again');
		} else {
			return cpu_avail;
		}
	}.property('total_cpu_selection'),

	// The total memory selected for the cluster
	total_ram_selection : function() {
		return (this.get('master_ram_selection') + this.get('slaves_ram_selection') * (this.size_of_cluster() - 1));
	}.property('master_ram_selection', 'slaves_ram_selection', 'project_name', 'cluster_size_var'),

	// Computes the available memory each time total_mem_selection changes
	ram_available : function() {
		ram_avail = this.get('content').objectAt(this.get('project_index')).get('mem_av') - this.get('total_ram_selection');
		if (ram_avail < 0) {
			alert('The cluster size you selected with the current ram choices exceed the ram quota. You should lower the clustersize, change ram values and select the clustersize again');
		} else {
			return ram_avail;
		}
	}.property('total_ram_selection'),

	// The total disk selected for the cluster
	total_disk_selection : function() {
		return (this.get('master_disk_selection') + this.get('slaves_disk_selection') * (this.size_of_cluster() - 1));
	}.property('master_disk_selection', 'slaves_disk_selection', 'project_name', 'cluster_size_var'),

	// Computes the available disk each time total_disk_selection changes
	disk_available : function() {
		disk_avail = this.get('content').objectAt(this.get('project_index')).get('disk_av') - this.get('total_disk_selection');
		if (disk_avail < 0) {
			alert('The cluster size you selected with the current disk choices exceed the disk quota. You should lower the clustersize, change disk values and select the clustersize again');
		} else {
			return disk_avail;
		}
	}.property('total_disk_selection'),

	// Computes the maximum VMs that can be build with current flavor choices and return this to the drop down menu on index
	// If a flavor selection of a role(master/slaves) is 0, we assume that the role should be able to have at least the minimum option of the corresponding flavor
	// Available VMs are limited by user quota. First, they are filtered with cpu limits, then with ram and finally with disk. The result is returned to the drop down menu on index
	max_cluster_size_av : function() {
		this.set('alert_mes_cluster_size', '');
		var length = this.get('content').objectAt(this.get('project_index')).get('vms_av').length;
		var max_cluster_size_limited_by_current_cpus = [];
		var max_cluster_size_limited_by_current_mems = [];
		var max_cluster_size_limited_by_current_disks = [];
		this.buttons();
		if ((this.get('project_name') === null) || (this.get('project_name') === undefined) || (this.get('project_name') === '')) {
			return [];
		}
		if (length < 2) {
			if (this.get('project_name') == undefined) {
				this.set('alert_mes_cluster_size', '');
			} else {
				this.set('alert_mes_cluster_size', 'Your VM quota are not enough to build the minimum cluster');
			}

			cluster_size_zero = true;
			return this.get('content').objectAt(this.get('project_index')).get('vms_av');
		}
		for (var i = 1; i < length; i++) {
			if (this.get('master_cpu_selection') == 0) {
				var master_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
			} else {
				var master_cpu = this.get('master_cpu_selection');
			}
			if (this.get('slaves_cpu_selection') == 0) {
				var slaves_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
			} else {
				var slaves_cpu = this.get('slaves_cpu_selection');
			}
			if ((this.get('content').objectAt(this.get('project_index')).get('cpu_av') - (master_cpu + ((this.get('content').objectAt(this.get('project_index')).get('vms_av')[i] - 1) * slaves_cpu))) < 0) {
				break;
			} else {
				for (var j = 0; j < i; j++) {
					max_cluster_size_limited_by_current_cpus[j] = this.get('content').objectAt(this.get('project_index')).get('vms_av')[j + 1];
				}
			}
		}
		length = max_cluster_size_limited_by_current_cpus.length;
		if (length == 0) {
			if (this.get('project_name') != '') {
				this.set('alert_mes_cluster_size', 'Your cpus quota are not enough to build the minimum cluster');
				alert(String(this));
				alert(String(this.get('project_name')));
			}
			cluster_size_zero = true;
			return max_cluster_size_limited_by_current_cpus;
		}
		for ( i = 0; i < length; i++) {
			if (this.get('master_ram_selection') == 0) {
				var master_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var master_ram = this.get('master_ram_selection');
			}
			if (this.get('slaves_ram_selection') == 0) {
				var slaves_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var slaves_ram = this.get('slaves_ram_selection');
			}
			if ((this.get('content').objectAt(this.get('project_index')).get('mem_av') - (master_ram + ((max_cluster_size_limited_by_current_cpus[i] - 1) * slaves_ram))) < 0) {
				break;
			} else {
				for ( j = 0; j <= i; j++) {
					max_cluster_size_limited_by_current_mems[j] = max_cluster_size_limited_by_current_cpus[j];
				}
			}
		}
		length = max_cluster_size_limited_by_current_mems.length;
		if (length == 0) {
			if (this.get('project_name') != '') {
				this.set('alert_mes_cluster_size', 'Your ram quota are not enough to build the minimum cluster');
			}
			cluster_size_zero = true;
			return max_cluster_size_limited_by_current_mems;
		}
		for ( i = 0; i < length; i++) {
			if (this.get('slaves_disk_selection') == 0) {
				var slaves_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var slaves_disk = this.get('slaves_disk_selection');
			}
			if (this.get('master_disk_selection') == 0) {
				var master_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var master_disk = this.get('master_disk_selection');
			}
			if ((this.get('content').objectAt(this.get('project_index')).get('disk_av') - (master_disk + ((max_cluster_size_limited_by_current_mems[i] - 1) * slaves_disk))) < 0) {
				break;
			}
			for ( j = 0; j <= i; j++) {
				max_cluster_size_limited_by_current_disks[j] = max_cluster_size_limited_by_current_mems[j];
			}
		}
		if (max_cluster_size_limited_by_current_disks.length == 0) {
			this.set('alert_mes_cluster_size', 'Your cpus quota are not enough to build the minimum cluster');
			cluster_size_zero = true;
		}
		return max_cluster_size_limited_by_current_disks;
	}.property('total_cpu_selection', 'total_ram_selection', 'total_disk_selection', 'disk_temp', 'cluster_size_var', 'cluster_size', 'project_details'),

    // Functionality about coloring of the vmflavor buttons and enable-disable responding to user events
	// First, remove colors from all vmflavor buttons and then color the role's(master/slaves) selection
    vmflavor_buttons : function() {
    	var elements = document.getElementsByName("vmflavor_button_Master");
		var length = elements.length;
		var vmflavors = this.get('content').objectAt(this.get('project_index')).get('vmflavors_choices');
		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (vmflav_disabled_Master) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (vmflav_masterMedium_disabled) {
				elements[1].disabled = true;
			}
			if (vmflav_masterLarge_disabled) {
				elements[2].disabled = true;
			}
			if ((this.get('vmflavor_selection_Master') !== undefined) && (this.get('vmflavor_selection_Master') !== null) && (this.get('vmflavor_selection_Master') !== '')) {
				var choice = document.getElementById("master_vmfalvors".concat(this.get('vmflavor_selection_Master')));
				if (((this.get('master_cpu_selection') == 2)&&(this.get('master_ram_selection') == 2048)&&(this.get('master_disk_selection') == 10))||(((this.get('master_cpu_selection') == 4)&&(this.get('master_ram_selection') == 2048)&&(this.get('master_disk_selection') == 20)))||(((this.get('master_cpu_selection') == 4)&&(this.get('master_ram_selection') == 4096)&&(this.get('master_disk_selection') == 40)))) {
					choice.style.color = "white";
				}				
			}
		}
		var elements = document.getElementsByName("vmflavor_button_Slave");
		var length = elements.length;
		var vmflavors = this.get('content').objectAt(this.get('project_index')).get('vmflavors_choices');
		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (vmflav_disabled_Slave) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (vmflav_slaveMedium_disabled) {
				elements[1].disabled = true;
			}
			if (vmflav_slaveLarge_disabled) {
				elements[2].disabled = true;
			}
			if ((this.get('vmflavor_selection_Slave') !== undefined) && (this.get('vmflavor_selection_Slave') !== null) && (this.get('vmflavor_selection_Slave') !== '')) {
				var choice = document.getElementById("slave_vmfalvors".concat(this.get('vmflavor_selection_Slave')));
				if (((this.get('slaves_cpu_selection') == 2)&&(this.get('slaves_ram_selection') == 2048)&&(this.get('slaves_disk_selection') == 10))||(((this.get('slaves_cpu_selection') == 4)&&(this.get('slaves_ram_selection') == 2048)&&(this.get('slaves_disk_selection') == 20)))||(((this.get('slaves_cpu_selection') == 4)&&(this.get('slaves_ram_selection') == 4096)&&(this.get('slaves_disk_selection') == 40)))) {
					choice.style.color = "white";
				}				
			}
		}
	},

	// Functionality about coloring of the cpu buttons and enable-disable responding to user events
	// First, remove colors from all cpu buttons and then color the role's(master/slaves) selection
	// Check all the possible combinations of selected role buttons with the unselected role's selection
	// (if selection is 0 we assume the minimum selection)
	// If the sum of them exceed the available cpu, then disable the selected role button.
	cpu_buttons : function() {
		var elements = document.getElementsByName("master_cpus_button");
		var length = elements.length;
		var cpus = this.get('content').objectAt(this.get('project_index')).get('cpu_choices');
		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('master_cpu_selection') != 0) {
				var choice = document.getElementById("master_cpus_".concat(this.get('master_cpu_selection')));
				choice.style.color = "white";
			}
			if (this.get('slaves_cpu_selection') == 0) {
				var slaves_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
			} else {
				var slaves_cpu = this.get('slaves_cpu_selection');
			}
			if (cpus[i] > (this.get('content').objectAt(this.get('project_index')).get('cpu_av') - slaves_cpu * (this.size_of_cluster() - 1) )) {
				elements[i].disabled = true;
				vmflav_disabled_Master=true;
			} else {
				elements[i].disabled = false;
				vmflav_disabled_Master=false;
			}
			if (elements[1].disabled == true) {
				vmflav_disabled_Master=true;
			}
			if (elements[2].disabled == true) {
				vmflav_masterMedium_disabled=true;
				vmflav_masterLarge_disabled=true;
			} else {
				vmflav_masterMedium_disabled=false;
				vmflav_masterLarge_disabled=false;
			}
		}

		var elements = document.getElementsByName("slaves_cpus_button");
		var length = elements.length;
		var cpus = this.get('content').objectAt(this.get('project_index')).get('cpu_choices');

		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('slaves_cpu_selection') != 0) {
				var choice = document.getElementById("slaves_cpus_".concat(this.get('slaves_cpu_selection')));
				choice.style.color = "white";
			}
			if (this.get('master_cpu_selection') == 0) {
				var master_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
			} else {
				var master_cpu = this.get('master_cpu_selection');
			}
			if (cpus[i] * (this.size_of_cluster() - 1) > (this.get('content').objectAt(this.get('project_index')).get('cpu_av') - master_cpu)) {
				elements[i].disabled = true;
				vmflav_disabled_Slave=true;
			} else {
				elements[i].disabled = false;
				vmflav_disabled_Slave=false;
			}
			if (elements[1].disabled == true) {
				vmflav_disabled_Slave=true;
			}
			if (elements[2].disabled == true) {
				vmflav_slaveMedium_disabled=true;
				vmflav_slaveLarge_disabled=true;
			} else {
				vmflav_slaveMedium_disabled=false;
				vmflav_slaveLarge_disabled=false;
		}
	},

	// Functionality about coloring of the memory buttons and enable-disable responding to user events
	// First, remove colors from all memory buttons and then color the role's(master/slaves) selection
	// Check all the possible combinations of selected role buttons with the unselected role's selection
	// (if selection is 0 we assume the minimum selection)
	// If the sum of them exceed the available memory, then disable the selected role button.
	memory_buttons : function() {

		var elements = document.getElementsByName("master_ram_button");
		var length = elements.length;
		var memories = this.get('content').objectAt(this.get('project_index')).get('mem_choices');

		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('master_ram_selection') != 0) {
				var choice = document.getElementById("master_ram_".concat(this.get('master_ram_selection')));
				choice.style.color = "white";
			}
			if (this.get('slaves_ram_selection') == 0) {
				var slaves_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var slaves_ram = this.get('slaves_ram_selection');
			}
			if (memories[i] > (this.get('content').objectAt(this.get('project_index')).get('mem_av') - slaves_ram * (this.size_of_cluster() - 1) )) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (elements[2].disabled == true) {
				vmflav_disabled_Master=true;
				vmflav_masterMedium_disabled=true;
			}
			if (elements[3].disabled == true) {
				vmflav_masterLarge_disabled=true;
			}		
		}

		var elements = document.getElementsByName("slaves_ram_button");
		var length = elements.length;
		var memories = this.get('content').objectAt(this.get('project_index')).get('mem_choices');

		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('slaves_ram_selection') != 0) {
				var choice = document.getElementById("slaves_ram_".concat(this.get('slaves_ram_selection')));
				choice.style.color = "white";
			}
			if (this.get('master_ram_selection') == 0) {
				var master_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var master_ram = this.get('master_ram_selection');
			}
			if (memories[i] * (this.size_of_cluster() - 1) > (this.get('content').objectAt(this.get('project_index')).get('mem_av') - master_ram)) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (elements[2].disabled == true) {
				vmflav_disabled_Slave=true;
				vmflav_slaveMedium_disabled=true;
			}
			if (elements[3].disabled == true) {
				vmflav_slaveLarge_disabled=true;
			}
		}
	},

	// Functionality about coloring of the disk size buttons and enable-disable responding to user events
	// First, remove colors from all disk size buttons and then color the role's(master/slaves) selection
	// Check all the possible combinations of selected role buttons with the unselected role's selection
	// (if selection is 0 we assume the minimum selection)
	// If the sum of them exceed the available disk size, then disable the selected role button.
	disk_buttons : function() {
		var elements = document.getElementsByName("master_disk_button");
		var length = elements.length;
		var disks = this.get('content').objectAt(this.get('project_index')).get('disk_choices');

		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('master_disk_selection') != 0) {
				var choice = document.getElementById("master_disk_".concat(this.get('master_disk_selection')));
				choice.style.color = "white";
			}
			if (this.get('slaves_disk_selection') == 0) {
				var slaves_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var slaves_disk = this.get('slaves_disk_selection');
			}
			if (disks[i] > (this.get('content').objectAt(this.get('project_index')).get('disk_av') - slaves_disk * (this.size_of_cluster() - 1) )) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (elements[1].disabled == true) {
				vmflav_disabled_Master=true;
			}
			if (elements[2].disabled == true) {
				vmflav_masterMedium_disabled=true;
			}
			if (elements[3].disabled == true) {
				vmflav_masterLarge_disabled=true;
			}
		}

		var elements = document.getElementsByName("slaves_disk_button");
		var length = elements.length;
		var disks = this.get('content').objectAt(this.get('project_index')).get('disk_choices');

		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			if (this.get('slaves_disk_selection') != 0) {
				var choice = document.getElementById("slaves_disk_".concat(this.get('slaves_disk_selection')));
				choice.style.color = "white";
			}
			if (this.get('master_disk_selection') == 0) {
				var master_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var master_disk = this.get('master_disk_selection');
			}
			if (disks[i] * (this.size_of_cluster() - 1) > (this.get('content').objectAt(this.get('project_index')).get('disk_av') - master_disk)) {
				elements[i].disabled = true;
			} else {
				elements[i].disabled = false;
			}
			if (elements[1].disabled == true) {
				vmflav_disabled_Slave=true;
			}
			if (elements[2].disabled == true) {
				vmflav_slaveMedium_disabled=true;
			}
			if (elements[3].disabled == true) {
				vmflav_slaveLarge_disabled=true;
			}
		}
	},

	// Functionality about storage buttons being colored when user selects one of them
	storage_buttons : function() {
		var elements = document.getElementsByName("storage_button");
		var length = elements.length;
		for (var i = 0; i < length; i++) {
			elements[i].style.color = "initial";
			var choice = document.getElementById(this.get('disk_temp'));
			choice.style.color = "white";
		}

		var elements = document.getElementsByName("storage_button");
		var length = elements.length;
		var disks = this.get('content').objectAt(this.get('project_index')).get('disk_template');
		for (var i = 0; i < length; i++) {
			elements[i].disabled = false;
		}
	},

	// Function which call each button function
	buttons : function() {
		this.cpu_buttons();
		this.memory_buttons();
		this.disk_buttons();
		this.storage_buttons();
		this.vmflavor_buttons();
=	},
	size_of_cluster : function() {
		if ((this.get('cluster_size') === null) || (this.get('cluster_size') === undefined) || (this.get('cluster_size') === 0)) {
			this.set('cluster_size_var', 2);
			return this.get('cluster_size_var');
		} else {
			this.set('cluster_size_var', this.get('cluster_size'));
			return this.get('cluster_size_var');
		}
	},
	// reset project variables
	reset_project : function() {
		this.set('project_index', 0);
		this.set('project_current', '');
		this.set('project_name', '');
		this.set('project_details', '');
		
	},
	// Reset variables after logout
	reset_variables : function() {
		this.set('cluster_size', 0);
		this.set('cluster_size_var', 0);
		this.set('master_cpu_selection', 0);
		this.set('slaves_cpu_selection', 0);
		this.set('master_ram_selection', 0);
		this.set('slaves_ram_selection', 0);
		this.set('master_disk_selection', 0);
		this.set('slaves_disk_selection', 0);
		this.set('cluster_name', '');
		this.set('operating_system', 'Debian Base');
		this.set('disk_temp', 'ext_vlmc');
		this.set('vmflavor_selection_Master', '');
		this.set('vmflavor_selection_Slave', '');
		this.set('message', '');
		this.init_alerts();
	},
	// initialize alert messages
	init_alerts : function() {
		this.set('alert_mes_master_cpu', '');
		this.set('alert_mes_master_ram', '');
		this.set('alert_mes_master_disk', '');
		this.set('alert_mes_slaves_cpu', '');
		this.set('alert_mes_slaves_ram', '');
		this.set('alert_mes_slaves_disk', '');
		this.set('alert_mes_cluster_name', '');
		this.set('alert_mes_cluster_size', '');
	},
	actions : {
		
		vm_flavor_selection : function(value, name) {
			if (name == "vmflavor_button_Master") {
				this.set('vmflavor_selection_Master', value);
				if (value == "Small") {
					this.set('master_cpu_selection', 2);
				    this.set('master_ram_selection', 2048);
				    this.set('master_disk_selection', 10);
				} 
				if (value == "Medium") {
					this.set('master_cpu_selection', 4);
				    this.set('master_ram_selection', 2048);
				    this.set('master_disk_selection', 20);
				}
				if (value == "Large") {
					this.set('master_cpu_selection', 4);
					this.set('master_ram_selection', 4096);
					this.set('master_disk_selection', 40);
				}
			}
			if (name == "vmflavor_button_Slave") {
				this.set('vmflavor_selection_Slave', value);
				if (value == "Small") {
					this.set('slaves_cpu_selection', 2);
					this.set('slaves_ram_selection', 2048);
					this.set('slaves_disk_selection', 10);
				}
				if (value == "Medium") {
					this.set('slaves_cpu_selection', 4);
					this.set('slaves_ram_selection', 2048);
					this.set('slaves_disk_selection', 20);
				}
				if (value == "Large") {				
					this.set('slaves_cpu_selection', 4);				
					this.set('slaves_ram_selection', 4096);				
					this.set('slaves_disk_selection', 40);
				}
			}			
		},

		// When a cpu button is clicked, the selected role's cpu selection takes the corresponding value
		cpu_selection : function(value, name) {
			if (name == "master_cpus_button") {
				// remove alert message
				this.set('alert_mes_master_cpu', '');
				if (this.get('slaves_cpu_selection') == 0) {
					var slaves_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
				} else {
					var slaves_cpu = this.get('slaves_cpu_selection');
				}
				if (value <= (this.get('content').objectAt(this.get('project_index')).get('cpu_av') - slaves_cpu * (this.size_of_cluster() - 1) )) {
					this.set('master_cpu_selection', value);
				}
			}
			if (name == "slaves_cpus_button") {
				// remove alert message
				this.set('alert_mes_slaves_cpu', '');
				if (this.get('master_cpu_selection') == 0) {
					var master_cpu = this.get('content').objectAt(this.get('project_index')).get('cpu_choices')[0];
				} else {
					var master_cpu = this.get('master_cpu_selection');
				}
				if (value * (this.size_of_cluster() - 1) <= (this.get('content').objectAt(this.get('project_index')).get('cpu_av') - master_cpu)) {
					this.set('slaves_cpu_selection', value);
				}
			}
		},

		// When a memory button is clicked, the selected role's memory selection takes the corresponding value
		ram_selection : function(value, name) {
			if (this.get('master_ram_selection') == 0) {
				var master_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var master_ram = this.get('master_ram_selection');
			}
			if (this.get('slaves_ram_selection') == 0) {
				var slaves_ram = this.get('content').objectAt(this.get('project_index')).get('mem_choices')[0];
			} else {
				var slaves_ram = this.get('slaves_ram_selection');
			}

			if (name == "master_ram_button") {
				// remove alert message
				this.set('alert_mes_master_ram', '');
				if (value <= (this.get('content').objectAt(this.get('project_index')).get('mem_av') - slaves_ram * (this.size_of_cluster() - 1) )) {
					this.set('master_ram_selection', value);
				}
			}
			if (name == "slaves_ram_button") {
				// remove alert message
				this.set('alert_mes_slaves_ram', '');
				if (value * (this.size_of_cluster() - 1) <= (this.get('content').objectAt(this.get('project_index')).get('mem_av') - master_ram)) {
					this.set('slaves_ram_selection', value);
				}
			}
		},

		// When a disk button is clicked, the selected role's disk selection takes the corresponding value
		disk_selection : function(value, name) {

			if (this.get('master_disk_selection') == 0) {
				var master_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var master_disk = this.get('master_disk_selection');
			}
			if (this.get('slaves_disk_selection') == 0) {
				var slaves_disk = this.get('content').objectAt(this.get('project_index')).get('disk_choices')[0];
			} else {
				var slaves_disk = this.get('slaves_disk_selection');
			}

			if (name == "master_disk_button") {
				// remove alert message
				this.set('alert_mes_master_disk', '');
				if (value <= (this.get('content').objectAt(this.get('project_index')).get('disk_av') - slaves_disk * (this.size_of_cluster() - 1) )) {
					this.set('master_disk_selection', value);
				}
			}
			if (name == "slaves_disk_button") {
				// remove alert message
				this.set('alert_mes_slaves_disk', '');
				if (value * (this.size_of_cluster() - 1) <= (this.get('content').objectAt(this.get('project_index')).get('disk_av') - master_disk)) {
					this.set('slaves_disk_selection', value);
				}
			}
		},

		// When a storage button is clicked, the selected role's storage selection takes the corresponding value
		disk_template_selection : function(value, name) {
			this.set('disk_temp', value);
		},
		// Cancel action when in create cluster -> redirect to user's welcome screen
		cancel : function() {
			this.set('create_cluster_disabled', true);
			// reset variables();
			this.reset_variables();
			this.reset_project();
			// redirect to welcome
			this.transitionToRoute('user.welcome');
		},
		// when create cluster button is pressed
		// go_to_create action is triggered
		go_to_create : function() {
			$options = {
				title : 'Redirect to welcome page and start building cluster...',
				fontColor : false,
				bgColor : 'transparent',
				size : 32,
				isOnly : true,
				bgOpacity : 1.0,
				imgUrl : DJANGO_STATIC_URL + "images/loading[size].gif",
				onShow : function() {
					$.loader.shown = true;
					$('.loading_wrp').find('span').addClass('text-info strong');
				},
				onClose : function() {
					$.loader.shown = false;
				}
			};
			//$('#next').loader($options); // on $('selector')

			this.init_alerts();
			// check that all fields are filled
			if ((this.get('cluster_size') === null) || (this.get('cluster_size') === undefined) || (this.get('cluster_size') === 0)) {
				this.set('alert_mes_cluster_size', 'Please select cluster size');
				// scroll to message
				var elem = document.getElementById("common_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('master_cpu_selection') == 0) {
				this.set('alert_mes_master_cpu', 'Please select master cpu');
				// scroll to message
				var elem = document.getElementById("master_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('master_ram_selection') == 0) {
				this.set('alert_mes_master_ram', 'Please select master memory');
				// scroll to message
				var elem = document.getElementById("master_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('master_disk_selection') == 0) {
				this.set('alert_mes_master_disk', 'Please select master disk');
				// scroll to message
				var elem = document.getElementById("master_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('slaves_cpu_selection') == 0) {
				this.set('alert_mes_slaves_cpu', 'Please select slaves cpu');
				// scroll to message
				var elem = document.getElementById("slaves_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('slaves_ram_selection') == 0) {
				this.set('alert_mes_slaves_ram', 'Please select slaves memory');
				// scroll to message
				var elem = document.getElementById("slaves_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('slaves_disk_selection') == 0) {
				this.set('alert_mes_slaves_disk', 'Please select slaves disk');
				// scroll to message
				var elem = document.getElementById("slaves_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else if (this.get('cluster_name') == '') {
				this.set('alert_mes_cluster_name', 'Please input cluster name');
				// scroll to message
				var elem = document.getElementById("common_settings");
				window.scrollTo(elem.offsetLeft, elem.offsetTop);
			} else {
				$.loader.open($options);
				//body
				// check if everything is allowed
				if ((this.get('total_cpu_selection') <= this.get('content').objectAt(this.get('project_index')).get('cpu_av')) && (this.get('total_ram_selection') <= this.get('content').objectAt(this.get('project_index')).get('mem_av')) && (this.get('total_disk_selection') <= this.get('content').objectAt(this.get('project_index')).get('disk_av'))) {
					var self = this;
					// PUT request
					var cluster_selection = this.store.update('clusterchoice', {
						// set the clusterchoice model with the user choices
						'id' : 1,
						'project_name' : self.get('project_name'),
						'cluster_name' : self.get('cluster_name'),
						'cluster_size' : self.get('cluster_size'),
						'cpu_master' : self.get('master_cpu_selection'),
						'mem_master' : self.get('master_ram_selection'),
						'disk_master' : self.get('master_disk_selection'),
						'cpu_slaves' : self.get('slaves_cpu_selection'),
						'mem_slaves' : self.get('slaves_ram_selection'),
						'disk_slaves' : self.get('slaves_disk_selection'),
						'disk_template' : self.get('disk_temp'),
						'os_choice' : self.get('operating_system')
					}).save();

					cluster_selection.then(function(data) {
						// Set the response to user's create cluster click when put succeeds.
						$.loader.close(true);
						self.set('message', data._data.message);
						self.set('controllers.userWelcome.output_message', data._data.message);
						self.set('controllers.userWelcome.create_cluster_start', false);
						self.store.fetch('user', 1);
					}, function() {
						// Set the response to user's create cluster click when put fails.
						$.loader.close(true);
						self.set('message', 'A problem occured during your request. Please check your cluster parameters and try again');
						self.set('controllers.userWelcome.output_message', 'A problem occured during your request. Please check your cluster parameters and try again');
						self.set('controllers.userWelcome.create_cluster_start', false);
						self.store.fetch('user', 1);
					});
					if (this.get('message') == "") {
						// after ten seconds goes to welcome route
						setTimeout(function() {
							self.set('controllers.userWelcome.create_cluster_start', true);
							self.transitionToRoute('user.welcome');
						}, 10000);
					} else {
						self.set('controllers.userWelcome.create_cluster_start', true);
						this.transitionToRoute('user.welcome');
					}
				} else {
					alert('Requested resources unavailable!');
					$.loader.close(true);
				}
			}
		}
	}
});
