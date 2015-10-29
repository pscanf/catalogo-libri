import {title} from "change-case";
import {v4} from "node-uuid";
import {last, partial, path, values} from "ramda";
import React, {Component, PropTypes} from "react";
import * as bootstrap from "react-bootstrap";

import EditRemoveCell from "components/edit-remove-cell";
import FabButton from "components/fab-button";
import Griddle from "components/griddle";
import Icon from "components/icon";
import RemoveModal from "components/remove-modal";
import SortIcon from "components/sort-icon";
import Spacer from "components/spacer";
import Spinner from "components/spinner";
import UpsertForm from "components/upsert-form";
import {fuzzyFilter} from "lib/utils";

export default class CollectionView extends Component {

    static propTypes = {
        UpsertFormComponent: PropTypes.func.isRequired,
        collectionName: PropTypes.string.isRequired,
        collections: PropTypes.object.isRequired,
        fetch: PropTypes.func.isRequired,
        filter: PropTypes.string,
        goToElementInsert: PropTypes.func.isRequired,
        goToElementRemove: PropTypes.func.isRequired,
        goToElementUpdate: PropTypes.func.isRequired,
        goToList: PropTypes.func.isRequired,
        remove: PropTypes.func.isRequired,
        router: PropTypes.object.isRequired,
        setFilter: PropTypes.func.isRequired,
        tableProperties: PropTypes.arrayOf(PropTypes.string),
        upsert: PropTypes.func.isRequired
    }

    static defaultProps = {
        collectionName: "books",
        tableProperties: ["_id"]
    }

    componentDidMount () {
        this.props.fetch(this.props.collectionName);
    }

    getElementId () {
        const {router} = this.props;
        return path(["params", "_id"], router);
    }

    getElement (_id) {
        const {collectionName, collections} = this.props;
        return path([collectionName, "elements", _id], collections);
    }

    getElements () {
        const {collectionName, collections, filter, tableProperties} = this.props;
        const elements = values(path([collectionName, "elements"], collections));
        return fuzzyFilter(elements, filter, tableProperties);
    }

    getColumns () {
        return this.props.tableProperties.concat(["_id"]);
    }

    getColumnsMetadata () {
        const {
            collectionName,
            goToElementRemove,
            goToElementUpdate,
            tableProperties
        } = this.props;
        return tableProperties
            .map(property => ({
                columnName: property,
                displayName: title(property)
            }))
            .concat([{
                columnName: "_id",
                customComponent: ({data}) => (
                    <EditRemoveCell
                        onEditClick={partial(goToElementUpdate, [collectionName, data])}
                        onRemoveClick={partial(goToElementRemove, [collectionName, data])}
                    />
                ),
                displayName: ""
            }]);
    }

    isFetching () {
        const {collectionName, collections} = this.props;
        return path([collectionName, "fetching"], collections);
    }

    isRoute (route) {
        const {router: {routes}} = this.props;
        return last(routes).name === `collection-${route}`;
    }

    handleUpsert (newElement) {
        const {collectionName, upsert} = this.props;
        upsert(
            collectionName,
            this.isRoute("insert") ? v4() : this.getElementId(),
            newElement
        );
    }

    handleRemove () {
        const {collectionName, remove} = this.props;
        remove(collectionName, this.getElementId());
    }

    renderAddButton () {
        const {collectionName, goToElementInsert} = this.props;
        return (
            <FabButton
                bsSize="small"
                bsStyle="primary"
                icon="content-add"
                onClick={partial(goToElementInsert, [collectionName])}
                style={{
                    position: "absolute",
                    bottom: "15px",
                    right: "15px"
                }}
            />
        );
    }

    renderSearchInput () {
        const {collectionName, filter, setFilter} = this.props;
        return (
            <bootstrap.Input
                addonAfter={<Icon icon="action-search" size="22px" />}
                onChange={({target: {value}}) => setFilter(collectionName, value)}
                placeholder="Search"
                type="text"
                value={filter}
            />
        );
    }

    renderList () {
        return !this.isFetching() ? (
            <Griddle
                columnMetadata={this.getColumnsMetadata()}
                columns={this.getColumns()}
                noDataMessage={`Collection ${this.props.collectionName} has no elements`}
                results={this.getElements()}
                resultsPerPage={0}
                showPager={false}
                sortAscendingComponent={<SortIcon direction="ascending" />}
                sortDescendingComponent={<SortIcon direction="descending" />}
                tableClassName="table table-striped table-hover"
                useGriddleStyles={false}
            />
        ) : <Spinner height="400px" />;
    }

    renderUpsertForm () {
        const {collectionName, goToList, UpsertFormComponent} = this.props;
        const elementId = this.getElementId();
        return (
            <UpsertForm
                Component={UpsertFormComponent}
                collectionName={collectionName}
                fields={UpsertFormComponent.fields}
                form={collectionName}
                formKey={elementId}
                initialValues={this.getElement(elementId)}
                inserting={this.isRoute("insert")}
                onCancel={partial(goToList, [collectionName])}
                onSubmit={::this.handleUpsert}
                show={this.isRoute("insert") || this.isRoute("update")}
            />
        );
    }

    renderRemoveModal () {
        const {collectionName, goToList} = this.props;
        const elementId = this.getElementId();
        return (
            <RemoveModal
                collectionName={collectionName}
                element={this.getElement(elementId)}
                onCancel={partial(goToList, [collectionName])}
                onConfirm={::this.handleRemove}
                show={this.isRoute("remove")}
            />
        );
    }

    render () {
        return (
            <bootstrap.Grid fluid>
                <Spacer direction="v" size={30} />
                <bootstrap.Row>
                    <bootstrap.Col xs={6} xsOffset={6}>
                        {this.renderSearchInput()}
                    </bootstrap.Col>
                    <bootstrap.Col xs={12}>
                        {this.renderList()}
                    </bootstrap.Col>
                </bootstrap.Row>
                {this.renderRemoveModal()}
                {this.renderUpsertForm()}
                {this.renderAddButton()}
            </bootstrap.Grid>
        );
    }

}
