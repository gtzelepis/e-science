// User Welcome controller
App.UserWelcomeController = Ember.Controller.extend({

	needs : 'clusterCreate',
	// output message of create cluster script
	output_message : '',
	// flag to see if the transition is from create cluster button
	create_cluster_start : false,
	count : 0,
	sortedclusters : [],
	column : '',
	sortdir : null,
	sortbyname : false,
	sortbydate : false,
	sortbystatus : false,
	sortbysize : false,
	sortbyurl : false,
	ip_of_master : '',
	sortedCollection : function() {
		// sorts content (clusters) based on properties
		return Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
			content : this.get('sortedclusters'),
			sortProperties : [this.get('column')],
			sortAscending : this.get('sortdir')
		});
	}.property('sortdir', 'sortbyname', 'sortbydate', 'sortbystatus', 'sortbysize', 'sortbyurl'),
	actions : {
		// sorts clusters based on selected column (name, date, status, size, IP)
		sortBy : function(clusters, column) {
			// flags used for showing/hiding arrows next to column names
			this.set('sortbynamearrow', false);
			this.set('sortbydatearrow', false);
			this.set('sortbystatusarrow', false);
			this.set('sortbysizearrow', false);
			this.set('sortbyurlarrow', false);
			this.set('sortedclusters', clusters);
			this.set('column', column);
			switch (column) {
			case 'cluster_name':	
				this.set('sortbynamearrow', true);															
				this.set('sortbyname', !this.get('sortbyname'));
				this.set('sortdir', this.get('sortbyname'));
				break;
			case 'action_date':
				this.set('sortbydatearrow', true);
				this.set('sortbydate', !this.get('sortbydate'));
				this.set('sortdir', this.get('sortbydate'));
				break;
			case 'cluster_status':
				this.set('sortbystatusarrow', true);
				this.set('sortbystatus', !this.get('sortbystatus'));
				this.set('sortdir', this.get('sortbystatus'));
				break;
			case 'cluster_size':
				this.set('sortbysizearrow', true);
				this.set('sortbysize', !this.get('sortbysize'));
				this.set('sortdir', this.get('sortbysize'));
				break;
			case 'master_IP':
				this.set('sortbyurlarrow', true);
				this.set('sortbyurl', !this.get('sortbyurl'));
				this.set('sortdir', this.get('sortbyurl'));
				break;
			}
		},
		timer : function(status, store) {
			var that = this;
			if (Ember.isNone(this.get('timer'))) {
				this.set('timer', App.Ticker.create({
					seconds : 5,
					onTick : function() {
						that.set('create_cluster_start', false);
						if (!store) {
							store = that.store;
						}
						if (store && that.controllerFor('application').get('loggedIn')) {
							var promise = store.fetch('user', 1);
							promise.then(function(user) {
								// success
								var user_clusters = user.get('clusters');
								var num_records = user_clusters.get('length');
								var bPending = false;
								for ( i = 0; i < num_records; i++) {
									if (user_clusters.objectAt(i).get('cluster_status') == '2') {
										bPending = true;
										var lastsort = that.get('column');
										if (!Ember.isBlank(lastsort)){
											that.send('sortBy', user_clusters, lastsort);
											that.send('sortBy', user_clusters, lastsort);
										}else{
											that.send('sortBy', user_clusters, 'action_date');
											that.send('sortBy', user_clusters, 'action_date');
										}
										break;
									}
								}
								if (!bPending) {
									if (that.get('count') > 0) {
										that.set('count', that.get('count')-1);
									}else{
										that.get('timer').stop();
										status = false;
									}
								}
							}, function(reason) {
								that.get('timer').stop();
								status = false;
								console.log(reason.message);
							});
							return promise;
						}
					}
				}));
			} else {
				if (status) {
					that.get('timer').start();
				} else {
					that.get('timer').stop();
				}
			}
			if (status) {
				this.get('timer').start();
			} else {
				this.get('timer').stop();
			}
		},
	}
});
