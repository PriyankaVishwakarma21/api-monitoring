//  Interface

export default class BaseRepository {

    constructor(model) {
        this.model = model;
    }

    async create(data) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not impemented');
    }

    async findByUsername(username) {
        throw new Error('Method not impemented');
    }

    async findByEmail(email) {
        throw new Error('Method not impemented');
    }

    async findAll() {
        throw new Error('Method not impemented');
    }
}
