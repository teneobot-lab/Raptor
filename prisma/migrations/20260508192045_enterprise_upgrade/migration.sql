-- AlterTable
ALTER TABLE `Transaction` ALTER COLUMN `invoiceNo` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_category_fkey` FOREIGN KEY (`category`) REFERENCES `Category`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE;
