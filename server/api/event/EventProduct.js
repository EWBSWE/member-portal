"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventProduct {
    constructor(id, productId, name, price, capacity, description) {
        this.id = id;
        this.productId = productId;
        this.name = name;
        this.price = price;
        this.capacity = capacity;
        this.description = description;
    }
    formatResponse() {
        return {
            id: this.id,
            productId: this.productId,
            product_id: this.productId,
            name: this.name,
            price: this.price,
            capacity: this.capacity,
            description: this.description
        };
    }
    static fromEntity(entity) {
        return new EventProduct(entity.id, entity.product_id, entity.name, entity.price, entity.capacity, entity.description);
    }
}
exports.EventProduct = EventProduct;
//# sourceMappingURL=EventProduct.js.map