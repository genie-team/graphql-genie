import '@ionic/core';
import '@stencil/core';

import { Component, Element, Listen, Prop, State } from '@stencil/core';
import { GraphTypeCtrl, SchemaTypeBuilder } from '../../providers/graphType';



@Component({
	tag: 'page-types',
	styleUrl: 'page-types.css',
})
export class PageSchedule {
	typeList: HTMLIonListElement;

	@Element() el: any;

	@State() types: SchemaTypeBuilder[] = [];


	@Prop({ connect: 'ion-modal-controller' }) modalCtrl: HTMLIonModalControllerElement;
	@Prop({ connect: 'ion-alert-controller' }) alertCtrl: HTMLIonAlertControllerElement;


	componentWillLoad() {
		this.updateTypes();
	}

	componentDidLoad() {
		this.typeList = this.el.querySelector('#typeList');
	}


	@Listen('body:ionModalWillDismiss')
	modalWillDismiss(event: CustomEvent) {
		console.info('modal will dismiss page types');
		if (event) {
			this.updateTypes();
		}
	}

	async handleDelete(name: string) {
		// create an alert instance
		const alert = await this.alertCtrl.create({
			title: 'Delete ' + name,
			message: '<p class="color-primary">Are you sure you want to delete ' + name + '?</p><p class="color-danger">This is permanent.<p>',
			cssClass: 'danger-alert',
			buttons: [
				{ text: 'Cancel' },
				{
					text: 'Delete',
					cssClass: 'danger-button',
					handler: () => {
						GraphTypeCtrl.deleteType(name);
						this.updateTypes();
					}
				}]
		});
		alert.present();
	}

	async updateTypes() {
		// Close any open sliding items when the schedule updates
		if (this.typeList) {
			this.typeList.closeSlidingItems();
		}

		this.types = GraphTypeCtrl.getTypes();
		this.el.forceUpdate();
	}

	async presentAddType() {
		const modal = await this.modalCtrl.create({
			component: 'page-add-type-modal'
		});
		await modal.present();
	}



	render() {

		return [
			<ion-header>
				<ion-toolbar>
					<ion-buttons slot="start">
						<ion-menu-button></ion-menu-button>
					</ion-buttons>
					<ion-title>Types</ion-title>
				</ion-toolbar>
				<ion-toolbar color="light">
					<ion-button onClick={() => this.presentAddType()} type="submit" expand="block">Add New Type</ion-button>
				</ion-toolbar>
			</ion-header>,

			<ion-content class="outer-content">
				<ion-list>
					<ion-grid>
						<ion-row align-items-stretch>
							{this.types.map(type => (
								<ion-col col-12 col-md-6 align-self-stretch>
									<ion-card class="type-card">

										<ion-card-header>
											<ion-item detail-none href={`/types/${type.name}`}>
												<h1>{type.name}</h1>
												<p> {type.description} </p>
											</ion-item>
										</ion-card-header>

										<ion-card-content>
											{type.fields && type.fields.map
												? <ion-list>
													{type.fields.map(field => (
														<ion-item href={`/speakers/session/${field.name}`}>
															<h3>{field.name}</h3>
														</ion-item>
													))} </ion-list>
												: <ion-list><ion-item>Create Field</ion-item></ion-list>
											}

										</ion-card-content>

										<ion-row no-padding justify-content-center>
											<ion-col col-auto text-left>
												<ion-button
													fill="clear"
													size="small"
													color="primary"
												>
													<ion-icon name="logo-twitter" slot="start"></ion-icon>
													Tweet
		</ion-button>
											</ion-col>
											<ion-col col-auto text-center>
												<ion-button
													fill="clear"
													size="small"
													color="primary"
												>
													<ion-icon name="share-alt" slot="start"></ion-icon>
													Share
		</ion-button>
											</ion-col>
											<ion-col col-auto text-right>
												<ion-button
													fill="clear"
													size="small"
													color="light"
													onClick={() => this.handleDelete(type.name)}
												>
													<ion-icon name="trash" slot="start"></ion-icon>
													Delete
								</ion-button>
											</ion-col>
										</ion-row>
									</ion-card>
								</ion-col>
							))}
						</ion-row>
					</ion-grid>
				</ion-list>
			</ion-content>
		];
	}
}
