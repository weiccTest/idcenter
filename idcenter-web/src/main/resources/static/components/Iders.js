// id提供者管理组件
const IdersTemplate = `
<div>
    <el-row>
        <el-col>
            <el-form :v-model="queryIdersForm" :inline="true" size="small">
                <el-form-item>
                    <el-input v-model="queryIdersForm.iderId" clearable placeholder="id编码"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="queryIders">查询</el-button>
                </el-form-item>
                <el-form-item v-if="manager.type === 'ADMIN'">
                    <el-button type="primary" icon="el-icon-plus" @click="addIderDialogVisible = true">新增</el-button>
                </el-form-item>
            </el-form>
        </el-col>
    </el-row>
    <el-table :data="iders" v-loading="idersLoading" border>
        <el-table-column prop="iderId" label="id编码"></el-table-column>
        <el-table-column prop="iderName" label="名称">
            <template slot-scope="{ row }">
                <el-input v-if="row.editing" v-model="row.editingIderName" type="textarea" autosize size="mini" placeholder="请输入名称"></el-input>
                <span v-else>{{ row.iderName }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="periodType" label="周期类型" width="80px">
            <template slot-scope="{ row }">
                <el-tag v-if="row.periodType === 'HOUR'" type="success" size="medium">每小时</el-tag>
                <el-tag v-else-if="row.periodType === 'DAY'" type="info" size="medium">每天</el-tag>
                <el-tag v-else-if="row.periodType === 'MONTH'" type="warning" size="medium">每月</el-tag>
                <el-tag v-else-if="row.periodType === 'YEAR'" type="danger" size="medium">每年</el-tag>
                <el-tag v-else-if="row.periodType === 'NONE'" size="medium">无周期</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="maxId" label="id最大值（不包含）" width="150px">
            <template slot-scope="{ row }">
                <el-input v-if="row.editing" v-model="row.editingMaxId" type="textarea" autosize size="mini" placeholder="无限制"></el-input>
                <div v-else>
                    <span v-if="row.maxId !== null">{{ row.maxId }}</span>
                    <el-tag v-else size="medium">无限制</el-tag>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="maxAmount" label="单次获取id最大数量" width="105px">
            <template slot-scope="{ row }">
                <el-input v-if="row.editing" v-model="row.editingMaxAmount" type="textarea" autosize size="mini" placeholder="无限制"></el-input>
                <div v-else>
                    <span v-if="row.maxAmount !== null">{{ row.maxAmount }}</span>
                    <el-tag v-else size="medium">无限制</el-tag>
                </div>
            </template>
        </el-table-column>
        <el-table-column prop="factor" label="生产者数量（因数）" width="95px">
            <template slot-scope="{ row }">
                <el-input v-if="row.editing" v-model="row.editingFactor" size="small"></el-input>
                <span v-else>{{ row.factor }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="idProducers" label="生产者" header-align="center" width="300">
            <template slot-scope="{ row }">
                <el-table :data="row.idProducers" :cell-style="{padding: '5px 0px'}" border stripe>
                    <el-table-column prop="index" label="序号" width="50px"></el-table-column>
                    <el-table-column prop="currentPeriod" label="当前周期" width="110px">
                        <template slot-scope="{ row }">
                            <span v-if="toShowingCurrentPeriod(row)">{{ toShowingCurrentPeriod(row) }}</span>
                            <el-tag v-else size="medium">无周期</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="currentId" label="当前id"></el-table-column>
                </el-table>
            </template>
        </el-table-column>
        <el-table-column label="操作" header-align="center" width="120px">
            <template slot-scope="{ row }">
                <el-row>
                    <el-col :span="16" style="text-align: center">
                        <el-tooltip v-if="!row.editing" content="修改" placement="top" :open-delay="1000" :hide-after="3000">
                            <el-button @click="startEditing(row)" type="primary" icon="el-icon-edit" size="mini" circle></el-button>
                        </el-tooltip>
                        <template v-else>
                            <el-button-group>
                                <el-tooltip content="取消修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="row.editing = false" type="info" icon="el-icon-close" size="mini" circle></el-button>
                                </el-tooltip>
                                <el-tooltip content="保存修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="saveEditing(row)" type="success" icon="el-icon-check" size="mini" circle></el-button>
                                </el-tooltip>
                            </el-button-group>
                        </template>
                    </el-col>
                    <el-col :span="8" style="text-align: center">
                        <el-tooltip content="删除" placement="top" :open-delay="1000" :hide-after="3000">
                            <el-button @click="deleteIder(row)" :disabled="manager.type !== 'ADMIN'" type="danger" icon="el-icon-delete" size="mini" circle></el-button>
                        </el-tooltip>
                    </el-col>
                </el-row>
                <div style="margin-top: 5px">
                    <el-row>
                        <el-col :span="16" :offset="5" style="text-align: center">
                            <el-tooltip content="修改当前周期和id" placement="top" :open-delay="1000" :hide-after="3000">
                                <el-button @click="startModifyCurrent(row)" type="warning" icon="el-icon-edit" size="mini" round>C</el-button>
                            </el-tooltip>
                        </el-col>
                    </el-row>
                </div>
            </template>
        </el-table-column>
    </el-table>
    <el-row style="margin-top: 10px">
        <el-col style="text-align: end">
            <el-pagination :total="totalIders" :current-page.sync="queryIdersForm.pageNo" :page-size.sync="queryIdersForm.pageSize" @current-change="queryIders" layout="total,prev,pager,next" small background></el-pagination>
        </el-col>
    </el-row>
    <el-dialog :visible.sync="addIderDialogVisible" :before-close="closeAddIderDialog" title="新增id提供者" width="40%">
        <el-form ref="addIderForm" :model="addIderForm" label-width="30%">
            <el-form-item label="id编码" prop="iderId" :rules="[{required:true, message:'请输入id编码', trigger:'blur'}]">
                <el-input v-model="addIderForm.iderId" clearable placeholder="请输入id编码" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="名称" prop="iderName" :rules="[{required:true, message:'请输入名称', trigger:'blur'}]">
                <el-input v-model="addIderForm.iderName" clearable placeholder="请输入名称" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="周期类型" prop="periodType" :rules="[{required:true, message:'请选择周期类型', trigger:'blur'}]">
                <el-select v-model="addIderForm.periodType" placeholder="请选择周期类型" style="width: 90%">
                    <el-option value="HOUR" label="每小时"></el-option>
                    <el-option value="DAY" label="每天"></el-option>
                    <el-option value="MONTH" label="每月"></el-option>
                    <el-option value="YEAR" label="每年"></el-option>
                    <el-option value="NONE" label="无周期"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="id最大值">
                <el-input v-model="addIderForm.maxId" clearable placeholder="不填表示不限制" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="单次最大数量">
                <el-input v-model="addIderForm.maxAmount" clearable placeholder="不填表示不限制" style="width: 90%"></el-input>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="closeAddIderDialog">取消</el-button>
            <el-button type="primary" @click="addIder">提交</el-button>
        </div>
    </el-dialog>
    <el-dialog :visible.sync="modifyCurrentDialogVisible" :before-close="closeModifyCurrentDialog" title="修改当前周期和id" width="40%">
        <el-form ref="modifyCurrentForm" :model="modifyCurrentForm" label-width="30%">
            <el-form-item label="新的当前周期" prop="newCurrentPeriod" :rules="[{required:modifyCurrentPeriodEnable(), message:'请输入新的当前周期', trigger:'blur'}]">
                <el-input v-model="modifyCurrentForm.newCurrentPeriod" :disabled="!modifyCurrentPeriodEnable()" clearable :placeholder="modifyCurrentForm.ider ? getPeriodFormat(modifyCurrentForm.ider.periodType) : ''"></el-input>
            </el-form-item>
            <el-form-item label="新的当前id" prop="newCurrentId" :rules="[{required:true, message:'请输入新的当前id', trigger:'blur'}]">
                <el-input v-model="modifyCurrentForm.newCurrentId" clearable placeholder="请输入新的当前id"></el-input>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="closeModifyCurrentDialog">取消</el-button>
            <el-button type="primary" @click="modifyCurrent">提交</el-button>
        </div>
    </el-dialog>
</div>
`;

const Iders = {
    template: IdersTemplate,
    data: function () {
        return {
            manager: CURRENT_MANAGER,
            queryIdersForm: {
                pageNo: 1,
                pageSize: 10,
                iderId: null
            },
            idersLoading: false,
            totalIders: 0,
            iders: [],
            addIderDialogVisible: false,
            addIderForm: {
                iderId: null,
                iderName: null,
                periodType: null,
                maxId: null,
                maxAmount: null
            },
            modifyCurrentDialogVisible: false,
            modifyCurrentForm: {
                ider: null,
                newCurrentPeriod: null,
                newCurrentId: null
            }
        };
    },
    created: function () {
        this.queryIders();
    },
    methods: {
        queryIders: function () {
            this.idersLoading = true;

            const theThis = this;
            axios.get('../manage/ider/queryManagedIders', {params: this.queryIdersForm})
                .then(function (result) {
                    theThis.idersLoading = false;
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                    }
                    theThis.totalIders = result.totalCount;
                    theThis.iders = result.infos;
                    theThis.iders.forEach(function (ider) {
                        Vue.set(ider, 'editing', false);
                        Vue.set(ider, 'editingIderName', null);
                        Vue.set(ider, 'editingMaxId', null);
                        Vue.set(ider, 'editingMaxAmount', null);
                        Vue.set(ider, 'editingFactor', null);
                        Vue.set(ider, 'savePopoverShowing', false);

                        ider.idProducers.forEach(function (idProducer) {
                            idProducer.ider = ider;
                        });
                    });
                });
        },
        startEditing: function (ider) {
            ider.editing = true;
            ider.editingIderName = ider.iderName;
            ider.editingMaxId = ider.maxId;
            ider.editingMaxAmount = ider.maxAmount;
            ider.editingFactor = ider.factor;
        },
        saveEditing: function (ider) {
            ider.savePopoverShowing = false;

            const theThis = this;
            let haveChange;
            if (ider.editingIderName !== ider.iderName) {
                haveChange = true;
                // 修改名称
                axios.post('../manage/ider/modifyIderName', {
                    iderId: ider.iderId,
                    newIderName: ider.editingIderName
                }).then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    Vue.prototype.$message.success(result.message);
                    theThis.queryIders();
                });
            }
            if (ider.editingMaxId !== ider.maxId || ider.editingMaxAmount !== ider.maxAmount) {
                haveChange = true;
                // 修改max
                axios.post('../manage/ider/modifyIderMax', {
                    iderId: ider.iderId,
                    newMaxId: ider.editingMaxId,
                    newMaxAmount: ider.editingMaxAmount
                }).then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    Vue.prototype.$message.success(result.message);
                    theThis.queryIders();
                });
            }
            if (ider.editingFactor !== ider.factor) {
                haveChange = true;
                // 修改factor
                axios.post('../manage/ider/modifyIderFactor', {
                    iderId: ider.iderId,
                    newFactor: ider.editingFactor
                }).then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    Vue.prototype.$message.success(result.message);
                    theThis.queryIders();
                });
            }
            if (!haveChange) {
                Vue.prototype.$message.error("无任何修改");
            }
        },
        deleteIder: function (ider) {
            const theThis = this;
            Vue.prototype.$confirm('确定删除id提供者？', '警告', {type: 'warning'})
                .then(function () {
                    axios.post('../manage/ider/deleteIder', {iderId: ider.iderId})
                        .then(function (result) {
                            if (!result.success) {
                                Vue.prototype.$message.error(result.message);
                                return;
                            }
                            Vue.prototype.$message.success(result.message);
                            theThis.queryIders();
                        });
                });
        },
        addIder: function () {
            const theThis = this;
            this.$refs.addIderForm.validate(function (valid) {
                if (!valid) {
                    return;
                }
                axios.post('../manage/ider/addIder', theThis.addIderForm)
                    .then(function (result) {
                        if (!result.success) {
                            Vue.prototype.$message.error(result.message);
                            return;
                        }
                        Vue.prototype.$message.success(result.message);
                        theThis.closeAddIderDialog();
                        theThis.queryIders();
                    });
            });
        },
        closeAddIderDialog: function () {
            this.$refs.addIderForm.clearValidate();
            this.addIderDialogVisible = false;
            this.addIderForm.iderId = null;
            this.addIderForm.iderName = null;
            this.addIderForm.periodType = null;
            this.addIderForm.maxId = null;
            this.addIderForm.maxAmount = null;
        },
        startModifyCurrent: function (ider) {
            this.modifyCurrentDialogVisible = true;
            this.modifyCurrentForm.ider = ider;
            this.modifyCurrentForm.newCurrentPeriod = null;
            this.modifyCurrentForm.newCurrentId = null;
        },
        modifyCurrent: function () {
            const theThis = this;
            this.$refs.modifyCurrentForm.validate(function (valid) {
                if (!valid) {
                    return;
                }
                axios.post('../manage/ider/modifyIderCurrent', {
                    iderId: theThis.modifyCurrentForm.ider.iderId,
                    newCurrentPeriod: theThis.modifyCurrentForm.newCurrentPeriod,
                    newCurrentId: theThis.modifyCurrentForm.newCurrentId
                }).then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    Vue.prototype.$message.success(result.message);
                    theThis.closeModifyCurrentDialog();
                    theThis.queryIders();
                });
            });
        },
        closeModifyCurrentDialog: function () {
            this.$refs.modifyCurrentForm.clearValidate();
            this.modifyCurrentDialogVisible = false;
            this.modifyCurrentForm.ider = null;
            this.modifyCurrentForm.newCurrentPeriod = null;
            this.modifyCurrentForm.newCurrentId = null;
        },
        modifyCurrentPeriodEnable: function () {
            if (!this.modifyCurrentForm.ider) {
                return true;
            }
            return this.modifyCurrentForm.ider.periodType !== 'NONE';
        },
        toShowingCurrentPeriod: function (idProducer) {
            let format = this.getPeriodFormat(idProducer.ider.periodType);
            if (!format) {
                return null;
            }
            let currentPeriod = new Date(idProducer.currentPeriod);
            return currentPeriod.format(format);
        },
        getPeriodFormat: function (periodType) {
            switch (periodType) {
                case 'HOUR':
                    return 'yyyyMMddhh';
                case 'DAY':
                    return 'yyyyMMdd';
                case 'MONTH':
                    return 'yyyyMM';
                case 'YEAR':
                    return 'yyyy';
                default:
                    return null;
            }
        }
    }
};